<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Банк тестов
          </h1>
          <p class="text-slate-500 font-medium">
            Управление банками вопросов и шаблонами тестов
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton
            v-if="canManageTestBanks"
            variant="primary"
            size="sm"
            class="h-10 px-4 gap-2 font-bold shadow-sm"
            @click="openCreateModal"
          >
            <Plus class="w-4 h-4" />
            Создать банк
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Bento Box Metrics -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
      <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Всего банков</p>
            <h3 class="mt-0.5 text-lg font-bold text-slate-900 dark:text-white">{{ stats.totalBanks }}</h3>
          </div>
          <div class="rounded-lg bg-primary/10 p-2 text-primary ml-2 shrink-0">
            <Library class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Активных</p>
            <h3 class="mt-0.5 text-lg font-bold text-success">{{ stats.activeBanks }}</h3>
          </div>
          <div class="rounded-lg bg-success/10 p-2 text-success ml-2 shrink-0">
            <CheckCircle class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Вопросов</p>
            <h3 class="mt-0.5 text-lg font-bold text-warning">{{ stats.totalQuestions }}</h3>
          </div>
          <div class="rounded-lg bg-warning/10 p-2 text-warning ml-2 shrink-0">
            <HelpCircle class="w-4 h-4" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all hover:shadow-md">
        <div class="flex items-center justify-between">
          <div class="min-w-0">
            <p class="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Категорий</p>
            <h3 class="mt-0.5 text-lg font-bold text-info">{{ stats.totalCategories }}</h3>
          </div>
          <div class="rounded-lg bg-info/10 p-2 text-info ml-2 shrink-0">
            <Tags class="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>

    <!-- Tabs Navigation -->
    <div class="mb-5 overflow-x-auto custom-scrollbar pb-1">
      <div class="inline-flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <nav class="flex gap-0.5">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all duration-300 whitespace-nowrap',
              activeTab === tab.id
                ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white'
                : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200',
            ]"
          >
            <component :is="tab.icon" class="h-3.5 w-3.5" />
            {{ tab.label }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Tab Content -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <!-- Main Content Area (8 cols) -->
      <div class="lg:col-span-8 space-y-4">
        <!-- BANKS TAB -->
        <div
          v-show="activeTab === 'banks'"
          class="space-y-4 animate-in fade-in duration-500"
        >
          <!-- Filters -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <Search class="w-4 h-4 text-info" />
              <h3 class="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Поиск</h3>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div class="md:col-span-2">
                  <div class="relative">
                    <input
                      v-model="filters.search"
                      type="text"
                      placeholder="Поиск по названию, коду..."
                      class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-10 pr-4 outline-none focus:border-primary text-sm"
                      @input="handleFilterChange"
                    />
                    <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <div class="relative">
                    <select
                      v-model="filters.category"
                      class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary text-sm appearance-none"
                      @change="handleFilterChange"
                    >
                      <option value="">Все категории</option>
                      <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
                    </select>
                    <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap gap-2 mt-3">
                <button
                  @click="filters.isActive = undefined; handleFilterChange()"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  :class="filters.isActive === undefined ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
                >
                  Все
                </button>
                <button
                  @click="filters.isActive = true; handleFilterChange()"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  :class="filters.isActive === true ? 'bg-success text-white' : 'bg-success/10 text-success hover:bg-success/20'"
                >
                  Активные
                </button>
                <button
                  @click="filters.isActive = false; handleFilterChange()"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                  :class="filters.isActive === false ? 'bg-slate-500 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'"
                >
                  Неактивные
                </button>
              </div>
            </div>
          </div>

          <!-- Banks List -->
          <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div v-if="loading" class="p-12 text-center">
              <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            </div>
            <div v-else-if="banks.length === 0" class="py-16 text-center">
              <Library class="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-4" />
              <p class="text-slate-500">Банки вопросов не найдены</p>
            </div>
            <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
              <div
                v-for="bank in banks"
                :key="bank.id"
                class="flex items-center gap-4 px-4 py-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group"
              >
                <div class="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Library class="w-5 h-5" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2 mb-1">
                    <h4 class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors truncate">
                      {{ bank.name }}
                    </h4>
                    <span
                      :class="['px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                        bank.is_active ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400']"
                    >
                      {{ bank.is_active ? 'Активен' : 'Неактивен' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3 text-xs text-slate-500">
                    <span class="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{{ bank.code }}</span>
                    <span v-if="bank.category" class="flex items-center gap-1">
                      <Tags class="w-3 h-3" /> {{ bank.category }}
                    </span>
                    <span>{{ bank.questions_count || 0 }} вопросов</span>
                    <span>{{ bank.templates_count || 0 }} шаблонов</span>
                  </div>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                  <button @click="viewBank(bank)" class="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-all" title="Открыть">
                    <ExternalLink class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canManageTestBanks"
                    @click="openEditModal(bank)"
                    class="p-2 text-slate-400 hover:text-warning hover:bg-warning/10 rounded-lg transition-all"
                    title="Редактировать"
                  >
                    <Pencil class="w-4 h-4" />
                  </button>
                  <button
                    v-if="canManageTestBanks"
                    @click="confirmDelete(bank)"
                    class="p-2 text-slate-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-all"
                    title="Удалить"
                  >
                    <Trash2 class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Pagination -->
            <div v-if="pagination.totalPages > 1" class="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <p class="text-xs text-slate-500">
                Страница {{ pagination.page }} из {{ pagination.totalPages }}
              </p>
              <div class="flex gap-1">
                <button
                  @click="changePage(pagination.page - 1)"
                  :disabled="pagination.page === 1"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  ←
                </button>
                <button
                  v-for="p in paginationRange"
                  :key="p"
                  @click="typeof p === 'number' && changePage(p)"
                  :class="['w-8 h-8 rounded-lg text-xs font-bold transition-all', typeof p !== 'number' ? 'text-slate-400 cursor-default' : pagination.page === p ? 'bg-primary text-white' : 'border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800']"
                >
                  {{ p }}
                </button>
                <button
                  @click="changePage(pagination.page + 1)"
                  :disabled="pagination.page >= pagination.totalPages"
                  class="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-700 disabled:opacity-50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sidebar (4 cols) -->
      <div class="lg:col-span-4 space-y-4">
        <!-- Quick Create -->
        <div v-if="canManageTestBanks" class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <Plus class="w-4 h-4 text-primary" />
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Быстрое действие</h4>
          </div>
          <div class="p-4">
            <UiButton class="w-full h-10 gap-2 font-bold" @click="openCreateModal">
              <Plus class="w-4 h-4" />
              Создать банк
            </UiButton>
          </div>
        </div>

        <!-- Categories -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <Tags class="w-4 h-4 text-warning" />
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Категории</h4>
          </div>
          <div v-if="categories.length === 0" class="p-4 text-center text-xs text-slate-400">
            Нет категорий
          </div>
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-800">
            <button
              v-for="cat in categories"
              :key="cat.category"
              @click="filters.category = cat.category; handleFilterChange()"
              :class="['w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors text-left', filters.category === cat.category ? 'bg-primary/5' : '']"
            >
              <span class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ cat.category }}</span>
              <div class="flex items-center gap-2">
                <span class="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{{ cat.count }}</span>
                <ArrowRight class="w-3 h-3 text-slate-400" />
              </div>
            </button>
          </div>
        </div>

        <!-- Info Card -->
        <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div class="flex items-center gap-2 px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <Info class="w-4 h-4 text-info" />
            <h4 class="text-xs font-black uppercase tracking-widest text-slate-500">Информация</h4>
          </div>
          <div class="p-4 text-xs text-slate-500 space-y-2">
            <p>Банки вопросов используются для создания шаблонов тестов.</p>
            <p>Каждый банк может содержать вопросы на разных языках.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <UiModal
      :is-open="modalOpen"
      :title="editingBank ? 'Редактировать банк' : 'Создать банк'"
      size="md"
      @close="closeModal"
    >
      <form @submit.prevent="saveBank" class="space-y-4">
        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Название <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Охрана труда - Базовый"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 outline-none focus:border-primary text-sm"
            :class="{ 'border-danger ring-2 ring-danger/10': formErrors.name }"
          />
          <p v-if="formErrors.name" class="mt-1 text-xs text-danger">{{ formErrors.name }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Код <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.code"
            type="text"
            placeholder="OT-BASE"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 outline-none focus:border-primary text-sm uppercase"
            :class="{ 'border-danger ring-2 ring-danger/10': formErrors.code }"
          />
          <p v-if="formErrors.code" class="mt-1 text-xs text-danger">{{ formErrors.code }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Категория
          </label>
          <input
            v-model="form.category"
            type="text"
            placeholder="Охрана труда"
            list="categories-list"
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 outline-none focus:border-primary text-sm"
          />
          <datalist id="categories-list">
            <option v-for="cat in categories" :key="cat" :value="cat" />
          </datalist>
        </div>

        <div>
          <label class="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Описание банка..."
            class="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 py-2.5 px-3 outline-none focus:border-primary text-sm resize-none"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Активен</span>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">Отмена</UiButton>
          <UiButton :loading="saving" @click="saveBank">
            {{ editingBank ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Delete Confirmation -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить банк?"
      :message="`Удалить '${deletingBank?.name}'? ${deletingBank?.questions_count ? `${deletingBank.questions_count} вопросов будет удалено.` : ''}`"
      variant="danger"
      :loading="deleting"
      @confirm="deleteBank"
      @cancel="deleteModalOpen = false"
    />

    <!-- Notifications -->
    <UiNotification
      v-if="notification.show"
      :type="notification.type"
      :title="notification.title"
      :message="notification.message"
      @close="notification.show = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  Plus, Library, CheckCircle, HelpCircle, Tags, Search, ChevronDown,
  Eye, Pencil, Trash2, ExternalLink, Info, Grid, List, FileText, ArrowRight
} from "lucide-vue-next";

definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const banks = ref([]);
const categories = ref([]);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const activeTab = ref("banks");
const availableTabs = [
  { id: "banks", label: "Банки", icon: Grid },
  { id: "info", label: "Информация", icon: Info },
];

const filters = ref({ search: "", category: "", isActive: undefined });

const stats = computed(() => ({
  totalBanks: pagination.value.total,
  activeBanks: banks.value.filter(b => b.is_active).length,
  totalQuestions: banks.value.reduce((s, b) => s + (b.questions_count || 0), 0),
  totalCategories: categories.value.length,
}));

const paginationRange = computed(() => {
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const range: (number | string)[] = [1];
  if (current > 3) range.push("...");
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) range.push(i);
  if (current < total - 2) range.push("...");
  range.push(total);
  return range;
});

const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingBank = ref(null);
const deletingBank = ref(null);

const form = ref({ name: "", code: "", category: "", description: "", is_active: true });
const formErrors = ref({ name: "", code: "" });

const notification = ref({ show: false, type: "success", title: "", message: "" });

const loadBanks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });
    if (filters.value.search) params.append("search", filters.value.search);
    if (filters.value.category) params.append("category", filters.value.category);
    if (filters.value.isActive !== undefined) params.append("is_active", String(filters.value.isActive));

    const response = await authFetch(`/api/test-bank/banks?${params.toString()}`);
    if (response.success) {
      banks.value = response.banks;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const loadCategories = async () => {
  try {
    const r = await authFetch("/api/test-bank/banks/categories");
    if (r.success) categories.value = r.categories;
  } catch (e) { console.error(e); }
};

const handleFilterChange = () => { pagination.value.page = 1; loadBanks(); };
const changePage = (p) => { if (p >= 1 && p <= pagination.value.totalPages) { pagination.value.page = p; loadBanks(); } };
const viewBank = (b) => navigateTo(`/test-bank/${b.id}`);

const openCreateModal = () => {
  editingBank.value = null;
  form.value = { name: "", code: "", category: "", description: "", is_active: true };
  formErrors.value = { name: "", code: "" };
  modalOpen.value = true;
};

const openEditModal = (b) => {
  editingBank.value = b;
  form.value = { name: b.name, code: b.code, category: b.category || "", description: b.description || "", is_active: b.is_active };
  formErrors.value = { name: "", code: "" };
  modalOpen.value = true;
};

const closeModal = () => { modalOpen.value = false; editingBank.value = null; };
const confirmDelete = (b) => { deletingBank.value = b; deleteModalOpen.value = true; };

const validateForm = () => {
  formErrors.value = { name: "", code: "" };
  let valid = true;
  if (!form.value.name.trim()) { formErrors.value.name = "Название обязательно"; valid = false; }
  if (!form.value.code.trim()) { formErrors.value.code = "Код обязателен"; valid = false; }
  else if (!/^[A-Z0-9-]+$/i.test(form.value.code)) { formErrors.value.code = "Только латинские буквы"; valid = false; }
  return valid;
};

const saveBank = async () => {
  if (!validateForm()) return;
  saving.value = true;
  try {
    const payload = { name: form.value.name.trim(), code: form.value.code.trim().toUpperCase(), category: form.value.category.trim() || undefined, description: form.value.description.trim() || undefined, is_active: form.value.is_active };
    const r = editingBank.value
      ? await authFetch(`/api/test-bank/banks/${editingBank.value.id}`, { method: "PUT", body: payload })
      : await authFetch("/api/test-bank/banks", { method: "POST", body: payload });

    if (r.success) {
      showNotification("success", "Успешно", editingBank.value ? "Банк обновлён" : "Банк создан");
      closeModal();
      loadBanks();
      loadCategories();
    } else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка сохранения"); }
  finally { saving.value = false; }
};

const deleteBank = async () => {
  if (!deletingBank.value) return;
  deleting.value = true;
  try {
    const r = await authFetch(`/api/test-bank/banks/${deletingBank.value.id}`, { method: "DELETE" });
    if (r.success) { showNotification("success", "Успешно", "Банк удалён"); deleteModalOpen.value = false; loadBanks(); loadCategories(); }
    else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка удаления"); }
  finally { deleting.value = false; }
};

const showNotification = (type: string, title: string, message: string) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => { loadBanks(); loadCategories(); });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>