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

interface RequestItem { id: string; courseId: string; courseName: string; trainingMonth: string; studentsCount: number; groupLabel: string | null; }
interface TrainingRequest {
  id: string; representativeName: string; organizationName: string;
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
const loading       = ref(true);
const saving        = ref<string | null>(null);
const requests      = ref<TrainingRequest[]>([]);
const stats         = ref<Stats | null>(null);
const selectedRequest = ref<TrainingRequest | null>(null);
const showDetailModal = ref(false);

// ─── Фильтры ───
const filterStatus = ref("");
const filterMonth  = ref("");
const filterCourse = ref("");
const currentPage  = ref(1);
const totalItems   = ref(0);
const PAGE_SIZE    = 20;

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
    if (filterStatus.value) params.status = filterStatus.value;
    if (filterMonth.value)  params.month  = filterMonth.value;

    const [requestsRes, statsRes] = await Promise.all([
      authFetch<{ success: boolean; data: TrainingRequest[]; total: number }>(
        "/api/training-requests", { params }
      ),
      authFetch<{ success: boolean; stats: Stats }>("/api/training-requests/stats"),
    ]);

    if (requestsRes.success) {
      requests.value = requestsRes.data;
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

// ─── Обновление статусов ───
async function patchRequest(
  id: string,
  changes: Partial<{ status: RequestStatus; contractStatus: ContractStatus; paymentStatus: PaymentStatus; adminComment: string }>
) {
  saving.value = id;
  try {
    await authFetch(`/api/training-requests/${id}`, { method: "PATCH", body: changes });
    notifySuccess("Заявка обновлена");
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

// ─── Детали заявки ───
async function openDetail(req: TrainingRequest) {
  selectedRequest.value = req;
  showDetailModal.value = true;
  // Загружаем полную версию с именами студентов
  try {
    const res = await authFetch<{ success: boolean; data: TrainingRequest }>(
      `/api/training-requests/${req.id}`
    );
    if (res.success) selectedRequest.value = res.data;
  } catch { /* силентли */ }
}

// ─── Утилиты ───
function formatDate(d: string) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function formatMonth(m: string) {
  if (!m) return "";
  const [y, mo] = m.split("-");
  return `${MONTHS_RU[parseInt(mo) - 1]} ${y}`;
}
function uniqueCourseNames(items: RequestItem[]) {
  return [...new Set(items.map((i) => i.courseName))];
}
function totalPages() { return Math.ceil(totalItems.value / PAGE_SIZE); }

// ─── Жизненный цикл ───
onMounted(loadData);
watch([filterStatus, filterMonth, currentPage], loadData);
</script>

<template>
  <div class="container mx-auto px-4 py-6">

    <!-- Заголовок -->
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Заявки на обучение</h1>
        <p class="text-gray-500 dark:text-gray-400 mt-1">
          Управление заявками от представителей организаций
        </p>
      </div>
      <button @click="loadData" :disabled="loading"
        class="mt-4 sm:mt-0 inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800
               border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium
               hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
        <svg class="w-4 h-4" :class="{ 'animate-spin': loading }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Обновить
      </button>
    </div>

    <!-- ─── Статистика ─── -->
    <div v-if="stats" class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats.totals.total }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Всего заявок</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-yellow-200 dark:border-yellow-800">
        <p class="text-2xl font-bold text-yellow-600">{{ stats.totals.pending }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">На рассмотрении</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-green-200 dark:border-green-800">
        <p class="text-2xl font-bold text-green-600">{{ stats.totals.approved }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Одобрено</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-blue-200 dark:border-blue-800">
        <p class="text-2xl font-bold text-blue-600">{{ stats.totals.in_progress }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">В процессе</p>
      </div>
      <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-red-200 dark:border-red-800">
        <p class="text-2xl font-bold text-red-600">{{ stats.totals.rejected }}</p>
        <p class="text-sm text-gray-500 dark:text-gray-400">Отклонено</p>
      </div>
    </div>

    <!-- ─── Аналитика по месяцам ─── -->
    <div v-if="stats && stats.byMonth.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">По месяцам</h2>
      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead>
            <tr class="text-left text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
              <th class="pb-2 font-medium">Месяц</th>
              <th class="pb-2 font-medium text-right">Заявок</th>
              <th class="pb-2 font-medium text-right">Слушателей</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in stats.byMonth" :key="row.month"
              class="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors"
              @click="filterMonth = (filterMonth === row.month ? '' : row.month)">
              <td class="py-2">
                <span class="font-medium text-gray-900 dark:text-white">{{ formatMonth(row.month) }}</span>
                <span v-if="filterMonth === row.month"
                  class="ml-2 text-xs bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded">активен</span>
              </td>
              <td class="py-2 text-right font-semibold text-gray-900 dark:text-white">{{ row.totalRequests }}</td>
              <td class="py-2 text-right text-gray-600 dark:text-gray-400">{{ row.totalStudents }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ─── Курсы топ ─── -->
    <div v-if="stats && stats.byCourse.length > 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
      <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-4">По курсам</h2>
      <div class="space-y-2">
        <div v-for="row in stats.byCourse.slice(0, 8)" :key="row.courseId"
          class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between mb-1">
              <span class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ row.courseName }}</span>
              <span class="text-sm text-gray-500 dark:text-gray-400 ml-2 shrink-0">
                {{ row.totalRequests }} заявок · {{ row.totalStudents }} сл.
              </span>
            </div>
            <div class="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div class="h-full bg-primary-500 rounded-full transition-all duration-500"
                :style="{ width: `${(row.totalRequests / stats!.byCourse[0].totalRequests) * 100}%` }">
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ─── Фильтры ─── -->
    <div class="flex flex-wrap gap-3 mb-4">
      <select v-model="filterStatus"
        class="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600
               rounded-lg text-sm text-gray-700 dark:text-gray-300">
        <option value="">Все статусы</option>
        <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>

      <button v-if="filterMonth"
        @click="filterMonth = ''"
        class="inline-flex items-center gap-1 px-3 py-2 bg-primary-50 dark:bg-primary-900/20
               text-primary-700 dark:text-primary-400 border border-primary-200 dark:border-primary-800
               rounded-lg text-sm font-medium">
        📅 {{ formatMonth(filterMonth) }}
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <span v-if="totalItems > 0" class="ml-auto self-center text-sm text-gray-500 dark:text-gray-400">
        Найдено: {{ totalItems }}
      </span>
    </div>

    <!-- ─── Загрузка ─── -->
    <div v-if="loading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
    </div>

    <!-- ─── Пусто ─── -->
    <div v-else-if="requests.length === 0"
      class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
      <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <p class="text-lg font-medium text-gray-900 dark:text-white mb-2">Заявок не найдено</p>
      <p class="text-gray-500 dark:text-gray-400">
        {{ filterStatus || filterMonth ? "Попробуйте изменить фильтры" : "Пока ни одной заявки не поступало" }}
      </p>
    </div>

    <!-- ─── Таблица ─── -->
    <div v-else class="space-y-3">
      <div v-for="req in requests" :key="req.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">

          <!-- Левая часть: информация -->
          <div class="flex-1 min-w-0">
            <!-- Шапка -->
            <div class="flex flex-wrap items-start gap-2 mb-2">
              <span :class="[STATUS_COLORS[req.status], 'px-2.5 py-0.5 rounded-full text-xs font-semibold']">
                {{ STATUS_LABELS[req.status] }}
              </span>
              <span class="text-sm text-gray-500 dark:text-gray-400">
                {{ formatDate(req.createdAt) }}
              </span>
            </div>

            <!-- Организация / представитель -->
            <div class="mb-2">
              <p class="font-semibold text-gray-900 dark:text-white">{{ req.organizationName }}</p>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ req.representativeName }}</p>
            </div>

            <!-- Курсы -->
            <div class="flex flex-wrap gap-1.5 mb-3">
              <span v-for="name in uniqueCourseNames(req.items)" :key="name"
                class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400
                       rounded-md text-xs font-medium">
                {{ name }}
              </span>
            </div>

            <!-- Счётчики + договор/оплата -->
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <span class="text-gray-600 dark:text-gray-400">
                📋 {{ req.totalItemsCount }} поз. · 👥 {{ req.totalStudentsCount }} чел.
              </span>
              <span :class="req.contractStatus === 'signed'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500'">
                {{ req.contractStatus === 'signed' ? '✓ Договор' : '∘ Договор' }}
              </span>
              <span :class="req.paymentStatus === 'paid'
                ? 'text-green-600 dark:text-green-400'
                : 'text-gray-400 dark:text-gray-500'">
                {{ req.paymentStatus === 'paid' ? '✓ Оплачено' : '∘ Оплата' }}
              </span>
            </div>

            <!-- Комментарий -->
            <div v-if="req.adminComment"
              class="mt-2 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50
                     rounded-lg px-3 py-2 border-l-2 border-primary-400">
              {{ req.adminComment }}
            </div>
          </div>

          <!-- Правая часть: управление -->
          <div class="flex flex-col gap-2 min-w-[200px]">
            <!-- Статус заявки -->
            <select
              :value="req.status"
              :disabled="saving === req.id"
              @change="patchRequest(req.id, { status: ($event.target as HTMLSelectElement).value as RequestStatus })"
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                     rounded-lg text-sm text-gray-900 dark:text-white disabled:opacity-50">
              <option v-for="(label, key) in STATUS_LABELS" :key="key" :value="key">{{ label }}</option>
            </select>

            <!-- Договор -->
            <select
              :value="req.contractStatus"
              :disabled="saving === req.id"
              @change="patchRequest(req.id, { contractStatus: ($event.target as HTMLSelectElement).value as ContractStatus })"
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                     rounded-lg text-sm text-gray-900 dark:text-white disabled:opacity-50">
              <option value="not_signed">Договор: не подписан</option>
              <option value="signed">Договор: подписан ✓</option>
            </select>

            <!-- Оплата -->
            <select
              :value="req.paymentStatus"
              :disabled="saving === req.id"
              @change="patchRequest(req.id, { paymentStatus: ($event.target as HTMLSelectElement).value as PaymentStatus })"
              class="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                     rounded-lg text-sm text-gray-900 dark:text-white disabled:opacity-50">
              <option value="not_paid">Оплата: не оплачено</option>
              <option value="paid">Оплата: оплачено ✓</option>
            </select>

            <!-- Кнопка деталей -->
            <button @click="openDetail(req)"
              class="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600
                     rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300
                     hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
              Подробнее →
            </button>
          </div>
        </div>
      </div>

      <!-- Пагинация -->
      <div v-if="totalPages() > 1" class="flex items-center justify-center gap-2 pt-2">
        <button
          :disabled="currentPage <= 1"
          @click="currentPage--"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm
                 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          ← Пред.
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ currentPage }} / {{ totalPages() }}
        </span>
        <button
          :disabled="currentPage >= totalPages()"
          @click="currentPage++"
          class="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm
                 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          След. →
        </button>
      </div>
    </div>

    <!-- ─── Модалка деталей ─── -->
    <div v-if="showDetailModal && selectedRequest"
      class="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto"
      @click.self="showDetailModal = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl my-8">
        <!-- Шапка модалки -->
        <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Детали заявки</h2>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ selectedRequest.organizationName }} · {{ formatDate(selectedRequest.createdAt) }}
            </p>
          </div>
          <button @click="showDetailModal = false"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Статусы заявки -->
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
              class="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
              <div class="flex items-start gap-3 mb-2">
                <span class="w-7 h-7 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400
                             rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {{ idx + 1 }}
                </span>
                <div class="flex-1">
                  <p class="font-semibold text-gray-900 dark:text-white">{{ item.courseName }}</p>
                  <div class="flex items-center gap-3 mt-1 text-sm text-gray-500 dark:text-gray-400">
                    <span>📅 {{ formatMonth(item.trainingMonth) }}</span>
                    <span>👥 {{ item.studentsCount }} чел.</span>
                    <span v-if="item.groupLabel" class="text-primary-600 dark:text-primary-400">{{ item.groupLabel }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Комментарий + редактирование -->
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
                   focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          ></textarea>
        </div>
      </div>
    </div>

  </div>
</template>
