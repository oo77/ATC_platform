<script setup lang="ts">
/**
 * Страница управления заявками на обучение (Admin / Moderator)
 */
definePageMeta({ layout: "default" });

// Иконки для нового интерфейса: кнопки шапки, KPI-полоса, меню строки
import {
  RefreshCw, FileDown, ClipboardList, Hourglass, CheckCircle2, Loader, XCircle,
  X, FileText, Pencil, Eye,
} from "lucide-vue-next";

const { authFetch } = useAuthFetch();
const { success: notifySuccess, error: notifyError } = useNotification();
const token = useCookie("auth_token");
const exporting = ref(false);

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

// ────────────────────────────────────────────
// Экспорт в Excel
// Принцип: передаём те же фильтры что и в списке,
// сервер сам применяет их при генерации файла  
// ────────────────────────────────────────────
async function exportToExcel() {
  exporting.value = true;
  try {
    // Строим query-параметры из текущих фильтров
    const params = new URLSearchParams();
    if (filterStatus.value)   params.set("status",         filterStatus.value);
    if (filterMonth.value)    params.set("month",          filterMonth.value);
    if (filterOrg.value)      params.set("organizationId", filterOrg.value);
    if (filterCourseId.value) params.set("courseId",       filterCourseId.value);

    const url = `/api/training-requests/export?${params.toString()}`;

    // Используем нативный fetch с Bearer-токеном — нельзя передать заголовок через <a href>
    const response = await fetch(url, {
      headers: {
        Authorization: token.value ? `Bearer ${token.value}` : "",
      },
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.statusMessage || "Ошибка генерации отчёта");
    }

    const blob = await response.blob();

    // Получаем имя файла из заголовка или генерируем
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?([^"]+)"?/);
    const filename = match?.[1] || `training-requests-${new Date().toISOString().slice(0,10)}.xlsx`;

    // Инициируем скачивание
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href     = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(blobUrl);

    notifySuccess(`Файл "${filename}" успешно скачан`);
  } catch (err: any) {
    notifyError(err?.message || "Не удалось скачать отчёт");
  } finally {
    exporting.value = false;
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

// Вкладки для UiTabs: счётчик на «Списке заявок» показывает объём, не заставляя открывать раздел
const requestTabs = computed(() => [
  { id: "list", label: "Список заявок", count: totalItems.value > 0 ? totalItems.value : undefined },
  { id: "analytics", label: "Аналитика" },
]);

// Макс по курсам для прогресс-баров
const maxCourseRequests = computed(() =>
  Math.max(...(stats.value?.byCourse.map((c) => c.totalRequests) || [1]), 1)
);

// ─── Жизненный цикл ───
onMounted(loadData);
watch([filterStatus, filterMonth, filterOrg, filterCourseId, currentPage], loadData);
</script>

<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">

    <!-- ═══ ЗАГОЛОВОК + ДЕЙСТВИЯ: единый PageHeader; «Обновить» — тихая иконка, «Excel» — вторичная кнопка ═══ -->
    <UiPageHeader title="Заявки на обучение" description="Управление заявками от представителей организаций">
      <template #actions>
        <!-- Обновить данные -->
        <UiButton variant="ghost" icon title="Обновить" aria-label="Обновить" :disabled="loading" @click="loadData">
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': loading }" />
        </UiButton>
        <!-- Excel-экспорт по текущим фильтрам -->
        <UiButton
          variant="outline"
          :start-icon="FileDown"
          :loading="exporting"
          :title="hasActiveFilters ? 'Выгрузить по текущим фильтрам' : 'Выгрузить все заявки'"
          @click="exportToExcel"
        >
          {{ exporting ? 'Формирование...' : hasActiveFilters ? 'Excel (по фильтрам)' : 'Excel' }}
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- ═══ KPI-фильтры одной строкой: клик по статусу = фильтр списка (прежняя логика, повторный клик снимает) ═══ -->
    <div v-if="stats" class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      <UiStat label="Всего заявок" :value="stats.totals.total" :icon="ClipboardList" tone="primary" clickable :active="!filterStatus" @click="filterStatus = ''; activeTab = 'list'" />
      <UiStat label="На рассмотрении" :value="stats.totals.pending" :icon="Hourglass" tone="warning" clickable :active="filterStatus === 'pending'" @click="filterStatus = filterStatus === 'pending' ? '' : 'pending'; activeTab = 'list'" />
      <UiStat label="Одобрено" :value="stats.totals.approved" :icon="CheckCircle2" tone="success" clickable :active="filterStatus === 'approved'" @click="filterStatus = filterStatus === 'approved' ? '' : 'approved'; activeTab = 'list'" />
      <UiStat label="В процессе" :value="stats.totals.in_progress" :icon="Loader" tone="info" clickable :active="filterStatus === 'in_progress'" @click="filterStatus = filterStatus === 'in_progress' ? '' : 'in_progress'; activeTab = 'list'" />
      <UiStat label="Отклонено" :value="stats.totals.rejected" :icon="XCircle" tone="danger" clickable :active="filterStatus === 'rejected'" @click="filterStatus = filterStatus === 'rejected' ? '' : 'rejected'; activeTab = 'list'" />
    </div>

    <!-- ═══ ТАБЫ: единый UiTabs со счётчиком вместо самописных кнопок ═══ -->
    <UiTabs v-model="activeTab" :tabs="requestTabs" />

    <!-- ════════════════════════════════════════ -->
    <!-- ТАБ: СПИСОК ЗАЯВОК                       -->
    <!-- ════════════════════════════════════════ -->
    <template v-if="activeTab === 'list'">

      <!-- ─── Фильтры одной строкой (у списка нет текстового поиска на сервере, поэтому UiFilterBar с обязательным полем поиска не подходит) ─── -->
      <div class="flex flex-wrap items-center gap-2 rounded-xl border border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-white/[0.03]">
        <!-- Статус -->
        <select v-model="filterStatus" @change="currentPage = 1"
          class="h-9 min-w-[150px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="">Все статусы</option>
          <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>

        <!-- Месяц -->
        <select v-model="filterMonth" @change="currentPage = 1"
          class="h-9 min-w-[150px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="">Все месяцы</option>
          <option v-for="row in (stats?.byMonth || [])" :key="row.month" :value="row.month">
            {{ formatMonth(row.month) }}
          </option>
        </select>

        <!-- Организация -->
        <select v-model="filterOrg" @change="currentPage = 1"
          class="h-9 min-w-[150px] max-w-[220px] rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
          <option value="">Все организации</option>
          <option v-for="org in orgList" :key="org.id" :value="org.id">{{ org.name }}</option>
        </select>

        <!-- Чип курса (появляется при выборе курса в аналитике) -->
        <span v-if="filterCourseId"
          class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary-50 px-3 text-sm font-medium text-primary-700 dark:bg-primary-500/15 dark:text-primary-300">
          Курс: выбран
          <button type="button" aria-label="Убрать фильтр по курсу" @click="filterCourseId = ''" class="rounded p-0.5 hover:bg-primary-100 dark:hover:bg-primary-500/30">
            <X class="h-3.5 w-3.5" />
          </button>
        </span>

        <!-- Сброс виден только когда есть что сбрасывать -->
        <button v-if="hasActiveFilters" type="button" @click="resetFilters"
          class="px-2 text-sm font-medium text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline dark:text-gray-400 dark:hover:text-gray-200">
          Сбросить всё
        </button>

        <span class="ml-auto text-sm text-gray-500 dark:text-gray-400" aria-live="polite">
          Найдено <span class="font-semibold tabular-nums text-gray-800 dark:text-gray-100">{{ totalItems }}</span>
        </span>
      </div>

      <!-- ─── Спиннер ─── -->
      <div v-if="loading" class="flex justify-center py-20">
        <div class="h-10 w-10 animate-spin rounded-full border-b-2 border-primary-600"></div>
      </div>

      <!-- ─── Пусто ─── -->
      <div v-else-if="requests.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <UiEmptyState
          :icon="FileText"
          title="Заявок не найдено"
          :description="hasActiveFilters ? 'Попробуйте изменить фильтры' : 'Пока ни одной заявки не поступало'"
        >
          <template v-if="hasActiveFilters" #actions>
            <UiButton variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
          </template>
        </UiEmptyState>
      </div>

      <!-- ─── Таблица: карточка со sticky-шапкой и пагинацией-футером ─── -->
      <div v-else id="requests-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div class="max-h-[70vh] overflow-auto">
          <table class="min-w-full text-left align-middle text-sm">
            <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr class="border-b border-gray-200 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th class="px-4 py-3 font-medium">Организация / Представитель</th>
                <th class="max-w-[220px] px-4 py-3 font-medium">Курсы</th>
                <th class="px-4 py-3 text-center font-medium">Объёмы</th>
                <th class="px-4 py-3 font-medium">Статус</th>
                <th class="px-4 py-3 font-medium">Договор / Оплата</th>
                <th class="px-4 py-3 text-right font-medium">Действия</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <!-- Строка кликабельна: открывает детали заявки -->
              <tr v-for="req in requests" :key="req.id" class="cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]" @click="openDetail(req)">
                <!-- Организация -->
                <td class="min-w-[180px] px-4 py-3">
                  <div class="font-semibold leading-tight text-gray-900 dark:text-white">{{ req.organizationName }}</div>
                  <div class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{{ req.representativeName }} · {{ formatDate(req.createdAt) }}</div>
                </td>
                <!-- Курсы (сокращённые) -->
                <td class="max-w-[240px] px-4 py-3">
                  <div class="flex flex-wrap gap-1">
                    <span v-for="name in uniqueCourseNames(req.items)" :key="name"
                      class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-300"
                      :title="name">
                      {{ shortName(name) }}
                    </span>
                  </div>
                </td>
                <!-- Объёмы -->
                <td class="px-4 py-3 text-center">
                  <div class="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{{ req.totalStudentsCount }}</div>
                  <div class="text-xs text-gray-400">чел. / {{ req.totalItemsCount }} поз.</div>
                </td>
                <!-- Статус -->
                <td class="px-4 py-3">
                  <span :class="[STATUS_COLORS[req.status], 'whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium']">
                    {{ STATUS_LABELS[req.status] }}
                  </span>
                  <div v-if="req.adminComment" class="mt-1.5 max-w-[160px] truncate text-xs text-gray-500" :title="req.adminComment">
                    {{ req.adminComment }}
                  </div>
                </td>
                <!-- Договор / оплата -->
                <td class="px-4 py-3">
                  <div class="flex flex-col gap-1 text-xs font-medium">
                    <span :class="req.contractStatus === 'signed' ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'">
                      {{ req.contractStatus === 'signed' ? '✓ Договор' : '○ Договор' }}
                    </span>
                    <span :class="req.paymentStatus === 'paid' ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'">
                      {{ req.paymentStatus === 'paid' ? '✓ Оплачено' : '○ Оплата' }}
                    </span>
                  </div>
                </td>
                <!-- Действия: 1 иконка (изменить статусы) + «⋯» (просмотр); клик не открывает детали дважды -->
                <td class="px-4 py-3 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1">
                    <UiButton variant="ghost" size="sm" icon title="Изменить статусы" aria-label="Изменить статусы" @click="openActionModal(req)">
                      <Pencil class="h-4 w-4" />
                    </UiButton>
                    <UiDropdown
                      icon-only
                      variant="ghost"
                      size="sm"
                      aria-label="Другие действия"
                      :groups="[{ items: [{ key: 'view', label: 'Просмотр деталей', icon: Eye }] }]"
                      @select="(key) => key === 'view' && openDetail(req)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- ─── Единая пагинация (раньше — самописная, показывала только страницы 1..7); размер страницы фиксирован ─── -->
        <UiPagination
          :current-page="currentPage"
          :total-pages="totalPages()"
          :total="totalItems"
          :limit="PAGE_SIZE"
          :loading="loading"
          hide-limit
          scroll-target="#requests-table"
          @update:page="(p: number) => (currentPage = p)"
        />
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

      <!-- Блоки аналитики: единый вертикальный ритм -->
      <div v-else class="space-y-4">

        <!-- ─── По месяцам ─── -->
        <div class="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">По месяцам</h2>
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
        <div class="bg-white dark:bg-white/[0.03] rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div class="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <h2 class="font-semibold text-gray-900 dark:text-white text-sm">По курсам</h2>
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
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg w-full max-w-2xl my-8">
        <!-- Шапка -->
        <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Детали заявки</h2>
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
              {{ selectedRequest.contractStatus === 'signed' ? '✓ Подписан' : '○ Не подписан' }}
            </span>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Оплата</p>
            <span :class="selectedRequest.paymentStatus === 'paid'
              ? 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400'
              : 'text-gray-500 bg-gray-50 dark:bg-gray-700 dark:text-gray-400'"
              class="px-2.5 py-1 rounded-full text-xs font-semibold">
              {{ selectedRequest.paymentStatus === 'paid' ? '✓ Оплачено' : '○ Не оплачено' }}
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
                      <span>{{ formatMonth(item.trainingMonth) }}</span>
                      <span>{{ item.studentsCount }} чел.</span>
                    </div>
                    <div v-if="item.groupLabel" class="mt-1 text-xs text-primary-600 font-medium">Группа: {{ item.groupLabel }}</div>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="!item.students || item.students.length === 0" class="shrink-0 text-xs px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg font-medium border border-yellow-200 dark:border-yellow-700/30">
                    Без персонализации
                  </span>
                  <!-- Toggle слушателей -->
                  <button v-else
                    @click="item._showStudents = !item._showStudents"
                    class="shrink-0 text-xs px-2.5 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium">
                    {{ item._showStudents ? 'Скрыть список' : 'Список слушателей' }}
                  </button>
                </div>
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
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-theme-lg w-full max-w-md p-5">
        <!-- Шапка -->
        <div class="flex items-center justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-gray-900 dark:text-white">Изменить статусы</h2>
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
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Статус заявки</label>
            <select v-model="activeActionRequest.status"
              class="w-full h-9 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>
          </div>
          <!-- Договор -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Договор</label>
            <select v-model="activeActionRequest.contractStatus"
              class="w-full h-9 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="not_signed">Не подписан</option>
              <option value="signed">Подписан ✓</option>
            </select>
          </div>
          <!-- Оплата -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Оплата</label>
            <select v-model="activeActionRequest.paymentStatus"
              class="w-full h-9 px-3 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent">
              <option value="not_paid">Не оплачено</option>
              <option value="paid">Оплачено ✓</option>
            </select>
          </div>
          <!-- Комментарий -->
          <div>
            <label class="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Комментарий</label>
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
