<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок страницы; единственное главное действие «Создать банк» справа -->
    <UiPageHeader
      title="Банк тестов"
      description="Банки вопросов используются для создания шаблонов тестов; каждый банк может содержать вопросы на разных языках"
    >
      <template #actions>
        <UiButton v-if="canManageTestBanks" variant="primary" :start-icon="Plus" @click="openCreateModal">
          Создать банк
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Метрики одной строкой вместо 4 крупных карточек: таблица оказывается выше сгиба -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Всего банков" :value="stats.totalBanks" :icon="Library" tone="primary" />
      <UiStat label="Активных (на странице)" :value="stats.activeBanks" :icon="CheckCircle" tone="success" />
      <UiStat label="Вопросов (на странице)" :value="stats.totalQuestions" :icon="HelpCircle" tone="warning" />
      <UiStat label="Категорий" :value="stats.totalCategories" :icon="Tags" tone="info" />
    </div>

    <!-- Единый блок фильтров. Категория — один контрол (в панели «Фильтры»); боковой список категорий убран с экрана, чтобы не дублировать -->
    <UiFilterBar
      v-model:search="filters.search"
      search-placeholder="Поиск по названию, коду…"
      :segments="bankSegments"
      :segment="bankSegment"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="test-bank"
      @search="handleFilterChange"
      @update:segment="setBankSegment"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #filters>
        <!-- Категория: единственный контрол выбора категории -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Категория</span>
          <select
            v-model="filters.category"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="handleFilterChange"
          >
            <option value="">Все категории</option>
            <!-- Исправлено: категории приходят объектами {category, count}, раньше в option выводился [object Object] -->
            <option v-for="cat in categories" :key="cat.category" :value="cat.category">{{ cat.category }} ({{ cat.count }})</option>
          </select>
        </label>
      </template>
    </UiFilterBar>

    <!-- Карточка со списком банков; пагинация — футер внутри карточки -->
    <div id="banks-list" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      </div>

      <!-- Пусто: объясняем причину и даём следующий шаг -->
      <UiEmptyState
        v-else-if="banks.length === 0"
        :icon="Library"
        title="Банки вопросов не найдены"
        description="Измените условия поиска или сбросьте фильтры"
      >
        <template #actions>
          <UiButton variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
        </template>
      </UiEmptyState>

      <!-- Список: строка кликабельна (открывает банк), справа 1 иконка + «⋯» -->
      <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <div
          v-for="bank in banks"
          :key="bank.id"
          class="group flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
          @click="viewBank(bank)"
        >
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-500/15">
            <Library class="h-5 w-5" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="mb-0.5 flex items-center gap-2">
              <h4 class="truncate text-sm font-semibold text-gray-900 transition-colors group-hover:text-primary dark:text-gray-100">
                {{ bank.name }}
              </h4>
              <UiBadge :color="bank.is_active ? 'success' : 'light'" size="sm">{{ bank.is_active ? 'Активен' : 'Неактивен' }}</UiBadge>
            </div>
            <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
              <span class="rounded bg-gray-100 px-1.5 py-0.5 font-mono dark:bg-white/[0.06]">{{ bank.code }}</span>
              <span v-if="bank.category" class="flex items-center gap-1"><Tags class="h-3 w-3" /> {{ bank.category }}</span>
              <span>{{ bank.questions_count || 0 }} вопросов</span>
              <span>{{ bank.templates_count || 0 }} шаблонов</span>
            </div>
          </div>

          <!-- Действия строки: всегда видны (в т.ч. на touch); клик не должен открывать банк -->
          <div class="flex shrink-0 items-center gap-1" @click.stop>
            <UiButton variant="ghost" size="sm" icon title="Открыть" aria-label="Открыть" @click="viewBank(bank)">
              <ExternalLink class="h-4 w-4" />
            </UiButton>
            <!-- Редактирование и удаление — в меню; удаление последним и красным -->
            <UiDropdown
              v-if="canManageTestBanks"
              icon-only
              variant="ghost"
              size="sm"
              aria-label="Действия с банком"
              :groups="bankMenuGroups"
              @select="(key) => onBankAction(key, bank)"
            />
          </div>
        </div>
      </div>

      <!-- Единая пагинация (limit у страницы фиксирован — выбор размера скрыт) -->
      <UiPagination
        :current-page="pagination.page"
        :total-pages="pagination.totalPages"
        :total="pagination.total"
        :limit="pagination.limit"
        :loading="loading"
        hide-limit
        scroll-target="#banks-list"
        @update:page="changePage"
      />
    </div>

    <!-- Модалка создания/редактирования -->
    <UiModal
      :is-open="modalOpen"
      :title="editingBank ? 'Редактировать банк' : 'Создать банк'"
      size="md"
      @close="closeModal"
    >
      <form @submit.prevent="saveBank" class="space-y-4">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Название <span class="text-error-500">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Охрана труда - Базовый"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            :class="{ 'border-error-500 ring-2 ring-error-500/10': formErrors.name }"
          />
          <p v-if="formErrors.name" class="mt-1 text-xs text-error-600">{{ formErrors.name }}</p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Код <span class="text-error-500">*</span>
          </label>
          <input
            v-model="form.code"
            type="text"
            placeholder="OT-BASE"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm uppercase text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
            :class="{ 'border-error-500 ring-2 ring-error-500/10': formErrors.code }"
          />
          <p v-if="formErrors.code" class="mt-1 text-xs text-error-600">{{ formErrors.code }}</p>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Категория</label>
          <input
            v-model="form.category"
            type="text"
            placeholder="Охрана труда"
            list="categories-list"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
          />
          <!-- Подсказки категорий: берём строковое поле category (раньше подставлялся объект) -->
          <datalist id="categories-list">
            <option v-for="cat in categories" :key="cat.category" :value="cat.category" />
          </datalist>
        </div>

        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Описание</label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Описание банка..."
            class="w-full resize-none rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
          ></textarea>
        </div>

        <div class="flex items-center gap-3 rounded-lg bg-gray-50 p-3 dark:bg-white/[0.04]">
          <label class="relative inline-flex cursor-pointer items-center">
            <input v-model="form.is_active" type="checkbox" class="peer sr-only" />
            <div class="h-6 w-11 rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 dark:bg-gray-700"></div>
          </label>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Активен</span>
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

    <!-- Подтверждение удаления (прежний обработчик deleteBank) -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить банк?"
      :message="`Удалить '${deletingBank?.name}'? ${deletingBank?.questions_count ? `${deletingBank.questions_count} вопросов будет удалено.` : ''}`"
      variant="danger"
      :loading="deleting"
      @confirm="deleteBank"
      @cancel="deleteModalOpen = false"
    />

    <!-- Уведомления -->
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

// Быстрый сегмент статуса для UiFilterBar: связывает трёхпозиционный filters.isActive (не меняя его) с сегментами
const bankSegments = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "inactive", label: "Неактивные" },
];
const bankSegment = computed(() => (filters.value.isActive === undefined ? "all" : filters.value.isActive ? "active" : "inactive"));
const setBankSegment = (v) => {
  filters.value.isActive = v === "all" ? undefined : v === "active";
  handleFilterChange();
};

// Чипы применённых фильтров (категория и статус) — состояние видно без открытия панели
const filterChips = computed(() => {
  const chips = [];
  if (filters.value.category) chips.push({ key: "category", label: `Категория: ${filters.value.category}` });
  if (filters.value.isActive !== undefined) chips.push({ key: "status", label: filters.value.isActive ? "Только активные" : "Только неактивные" });
  return chips;
});

// Меню «⋯» строки: удаление — последним пунктом и красным
const bankMenuGroups = [
  { items: [{ key: "edit", label: "Редактировать", icon: Pencil }] },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];
// Диспетчер меню вызывает прежние обработчики openEditModal / confirmDelete
const onBankAction = (key, bank) => {
  if (key === "edit") openEditModal(bank);
  else if (key === "delete") confirmDelete(bank);
};

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
// Сброс всех фильтров одним действием (всегда доступен через UiFilterBar)
const resetFilters = () => {
  filters.value = { search: "", category: "", isActive: undefined };
  handleFilterChange();
};
// Снятие отдельного чипа фильтра
const removeFilterChip = (key) => {
  if (key === "category") filters.value.category = "";
  if (key === "status") filters.value.isActive = undefined;
  handleFilterChange();
};
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
