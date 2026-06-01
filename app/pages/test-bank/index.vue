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
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего банков</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalBanks }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <Library class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.activeBanks }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Вопросов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalQuestions }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <HelpCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Категорий</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalCategories }}</h3>
          </div>
          <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
            <Tags class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

    <!-- Navigation Tabs (связанные подразделы test-bank) -->
    <div class="mb-8 overflow-x-auto custom-scrollbar pb-2">
      <div class="inline-flex rounded-2xl bg-slate-100 p-1.5 dark:bg-slate-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            @click="navigateTo('/test-bank')"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', $route.path === '/test-bank' ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <Library class="h-4 w-4" />
            Банки вопросов
          </button>
          <button
            @click="navigateTo('/test-templates')"
            :class="['flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all duration-300 whitespace-nowrap', $route.path === '/test-templates' ? 'bg-white text-primary shadow-sm dark:bg-slate-700 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200']"
          >
            <FileText class="h-4 w-4" />
            Шаблоны тестов
          </button>
        </nav>
      </div>
    </div>

    <!-- Фильтры и поиск -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6 mb-6">
      <div class="flex items-center justify-between mb-6">
        <div class="flex items-center gap-3">
          <div class="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Filter class="w-5 h-5" />
          </div>
          <h4 class="text-lg font-bold text-slate-900 dark:text-white">
            Фильтры
          </h4>
        </div>
        <button
          v-if="hasActiveFilters"
          @click="resetFilters"
          class="text-sm font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/10"
        >
          <RotateCcw class="w-4 h-4" />
          Сбросить фильтры
        </button>
      </div>

      <div class="flex flex-col gap-6">
        <!-- Поиск -->
        <div class="relative max-w-xl">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Поиск по названию, коду банка..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Категория -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Tags class="w-3.5 h-3.5" />
              Категория
            </label>
            <div class="relative">
              <select
                v-model="filters.category"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все категории</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <!-- Статус -->
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Activity class="w-3.5 h-3.5" />
              Статус
            </label>
            <div class="flex flex-wrap gap-2">
              <button
                @click="filters.isActive = undefined; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all"
                :class="filters.isActive === undefined ? 'bg-slate-800 text-white shadow-md dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'"
              >
                Все
              </button>
              <button
                @click="filters.isActive = true; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === true ? 'bg-success text-white shadow-md shadow-success/20' : 'bg-success/5 text-success hover:bg-success/10 border border-success/20'"
              >
                <span v-if="filters.isActive === true" class="w-1.5 h-1.5 rounded-full bg-white"></span>
                Активные
              </button>
              <button
                @click="filters.isActive = false; handleFilterChange()"
                class="px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-1.5"
                :class="filters.isActive === false ? 'bg-slate-500 text-white shadow-md dark:bg-slate-400 dark:text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'"
              >
                Неактивные
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Список банков -->
    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <!-- Загрузка -->
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-medium tracking-wide">
          Загрузка банков вопросов...
        </p>
      </div>

      <!-- Пустой список -->
      <div
        v-else-if="banks.length === 0"
        class="py-20 px-6 text-center text-slate-500 dark:text-slate-400"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <Library class="h-10 w-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Банки вопросов не найдены</h3>
        <p class="max-w-md mx-auto text-slate-500">
          Создайте первый банк вопросов, нажав кнопку "Создать банк" в правом верхнем углу
        </p>
      </div>

      <!-- Таблица -->
      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Банк</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Код</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Категория</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Вопросов</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Шаблонов</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Статус</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="bank in banks"
              :key="bank.id"
              class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-inner border border-primary/10">
                    <Library class="w-5 h-5" />
                  </div>
                  <div>
                    <h5 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {{ bank.name }}
                    </h5>
                    <p v-if="bank.description" class="text-sm text-slate-500 line-clamp-1 max-w-xs">
                      {{ bank.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle">
                <span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ bank.code }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle">
                <span v-if="bank.category" class="inline-flex items-center rounded-full bg-info/10 px-2.5 py-1 text-xs font-bold text-info">
                  {{ bank.category }}
                </span>
                <span v-else class="text-slate-400 font-medium">—</span>
              </td>
              <td class="px-6 py-4 align-middle text-center">
                <span class="inline-flex items-center justify-center min-w-10 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                  {{ bank.questions_count || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-center">
                <span class="inline-flex items-center justify-center min-w-10 rounded-full bg-info/10 px-2.5 py-1 text-sm font-bold text-info">
                  {{ bank.templates_count || 0 }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                    bank.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                  ]"
                >
                  {{ bank.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="viewBank(bank)"
                    class="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Просмотр"
                  >
                    <Eye class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTestBanks"
                    @click="openEditModal(bank)"
                    class="p-2 text-slate-500 hover:text-warning hover:bg-warning/10 rounded-xl transition-colors"
                    title="Редактировать"
                  >
                    <Pencil class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTestBanks"
                    @click="confirmDelete(bank)"
                    class="p-2 text-slate-500 hover:text-danger hover:bg-danger/10 rounded-xl transition-colors"
                    title="Удалить"
                  >
                    <Trash2 class="w-5 h-5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div
        v-if="pagination.totalPages > 1"
        class="border-t border-slate-200 dark:border-slate-800 px-6 py-4 bg-slate-50/30 dark:bg-slate-800/30"
      >
        <div class="flex items-center justify-between">
          <div class="text-sm font-medium text-slate-500">
            Показано
            <span class="font-bold text-slate-900 dark:text-white">{{ (pagination.page - 1) * pagination.limit + 1 }}</span>
            -
            <span class="font-bold text-slate-900 dark:text-white">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
            из
            <span class="font-bold text-slate-900 dark:text-white">{{ pagination.total }}</span>
          </div>
          <div class="flex gap-2">
            <button
              @click="changePage(pagination.page - 1)"
              :disabled="pagination.page === 1"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Назад
            </button>
            <button
              @click="changePage(pagination.page + 1)"
              :disabled="pagination.page >= pagination.totalPages"
              class="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm transition-all"
            >
              Вперёд
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Модальное окно создания/редактирования банка -->
    <UiModal
      :is-open="modalOpen"
      :title="editingBank ? 'Редактировать банк вопросов' : 'Создать банк вопросов'"
      size="md"
      @close="closeModal"
    >
      <form @submit.prevent="saveBank" class="space-y-4">
        <!-- Название -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Название <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.name"
            type="text"
            placeholder="Например: Охрана труда - Базовый уровень"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            :class="{ 'border-danger ring-2 ring-danger/10': formErrors.name }"
          />
          <p v-if="formErrors.name" class="mt-1 text-sm text-danger font-medium">{{ formErrors.name }}</p>
        </div>

        <!-- Код -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Код <span class="text-danger">*</span>
          </label>
          <input
            v-model="form.code"
            type="text"
            placeholder="Например: OT-BASE"
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium uppercase"
            :class="{ 'border-danger ring-2 ring-danger/10': formErrors.code }"
          />
          <p v-if="formErrors.code" class="mt-1 text-sm text-danger font-medium">{{ formErrors.code }}</p>
          <p class="mt-1 text-xs text-slate-500 font-medium">Уникальный код для идентификации банка</p>
        </div>

        <!-- Категория -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Категория
          </label>
          <div class="relative">
            <input
              v-model="form.category"
              type="text"
              placeholder="Например: Охрана труда"
              list="categories-list"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            />
            <datalist id="categories-list">
              <option v-for="cat in categories" :key="cat" :value="cat" />
            </datalist>
          </div>
          <p class="mt-1 text-xs text-slate-500 font-medium">Для группировки банков вопросов</p>
        </div>

        <!-- Описание -->
        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="3"
            placeholder="Краткое описание банка вопросов..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium resize-none"
          ></textarea>
        </div>

        <!-- Активность -->
        <div class="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <label class="relative inline-flex items-center cursor-pointer">
            <input
              v-model="form.is_active"
              type="checkbox"
              class="sr-only peer"
            />
            <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-bold text-slate-700 dark:text-slate-300">
            Банк активен
          </span>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveBank">
            {{ editingBank ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Модальное окно подтверждения удаления -->
    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить банк вопросов?"
      :message="`Вы уверены, что хотите удалить банк '${deletingBank?.name}'? ${deletingBank?.questions_count ? `В банке ${deletingBank.questions_count} вопросов, которые также будут удалены.` : ''} Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
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

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Plus, Library, CheckCircle, HelpCircle, Tags, Filter, RotateCcw, Search, ChevronDown, Activity, Eye, Pencil, Trash2, FileText } from 'lucide-vue-next';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

// Используем authFetch для авторизованных запросов
const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();
const router = useRouter();
const route = useRoute();

// Состояние
const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const banks = ref([]);
const categories = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  search: '',
  category: '',
  isActive: undefined,
});

// Статистика
const stats = computed(() => {
  return {
    totalBanks: pagination.value.total,
    activeBanks: banks.value.filter(b => b.is_active).length,
    totalQuestions: banks.value.reduce((sum, b) => sum + (b.questions_count || 0), 0),
    totalCategories: categories.value.length,
  };
});

// Проверка активных фильтров
const hasActiveFilters = computed(() => {
  return filters.value.search !== '' ||
    filters.value.category !== '' ||
    filters.value.isActive !== undefined;
});

// Модальные окна
const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingBank = ref(null);
const deletingBank = ref(null);

// Форма
const form = ref({
  name: '',
  code: '',
  category: '',
  description: '',
  is_active: true,
});

const formErrors = ref({
  name: '',
  code: '',
});

// Уведомления
const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

// Загрузка банков
const loadBanks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) {
      params.append('search', filters.value.search);
    }

    if (filters.value.category) {
      params.append('category', filters.value.category);
    }

    if (filters.value.isActive !== undefined) {
      params.append('is_active', filters.value.isActive.toString());
    }

    const response = await authFetch(`/api/test-bank/banks?${params.toString()}`);

    if (response.success) {
      banks.value = response.banks;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error('Ошибка загрузки банков:', error);
    showNotification('error', 'Ошибка', 'Не удалось загрузить банки вопросов');
  } finally {
    loading.value = false;
  }
};

// Загрузка категорий
const loadCategories = async () => {
  try {
    const response = await authFetch('/api/test-bank/banks/categories');
    if (response.success) {
      categories.value = response.categories;
    }
  } catch (error) {
    console.error('Ошибка загрузки категорий:', error);
  }
};

// Обработчики
const handleFilterChange = () => {
  pagination.value.page = 1;
  loadBanks();
};

const resetFilters = () => {
  filters.value.search = '';
  filters.value.category = '';
  filters.value.isActive = undefined;
  pagination.value.page = 1;
  loadBanks();
};

const changePage = (page) => {
  pagination.value.page = page;
  loadBanks();
};

const viewBank = (bank) => {
  navigateTo(`/test-bank/${bank.id}`);
};

// Модальные окна
const openCreateModal = () => {
  editingBank.value = null;
  form.value = {
    name: '',
    code: '',
    category: '',
    description: '',
    is_active: true,
  };
  formErrors.value = { name: '', code: '' };
  modalOpen.value = true;
};

const openEditModal = (bank) => {
  editingBank.value = bank;
  form.value = {
    name: bank.name,
    code: bank.code,
    category: bank.category || '',
    description: bank.description || '',
    is_active: bank.is_active,
  };
  formErrors.value = { name: '', code: '' };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingBank.value = null;
};

const confirmDelete = (bank) => {
  deletingBank.value = bank;
  deleteModalOpen.value = true;
};

// Валидация формы
const validateForm = () => {
  formErrors.value = { name: '', code: '' };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Название обязательно';
    isValid = false;
  } else if (form.value.name.length < 3) {
    formErrors.value.name = 'Минимум 3 символа';
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = 'Код обязателен';
    isValid = false;
  } else if (!/^[A-Z0-9-]+$/i.test(form.value.code)) {
    formErrors.value.code = 'Только латинские буквы, цифры и дефис';
    isValid = false;
  }

  return isValid;
};

// Сохранение банка
const saveBank = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim().toUpperCase(),
      category: form.value.category.trim() || undefined,
      description: form.value.description.trim() || undefined,
      is_active: form.value.is_active,
    };

    let response;
    if (editingBank.value) {
      response = await authFetch(`/api/test-bank/banks/${editingBank.value.id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await authFetch('/api/test-bank/banks', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification('success', 'Успешно', editingBank.value ? 'Банк вопросов обновлён' : 'Банк вопросов создан');
      closeModal();
      loadBanks();
      loadCategories();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить банк');
    }
  } catch (error) {
    console.error('Ошибка сохранения банка:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

// Удаление банка
const deleteBank = async () => {
  if (!deletingBank.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(`/api/test-bank/banks/${deletingBank.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('success', 'Успешно', 'Банк вопросов удалён');
      deleteModalOpen.value = false;
      deletingBank.value = null;
      loadBanks();
      loadCategories();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось удалить банк');
    }
  } catch (error) {
    console.error('Ошибка удаления банка:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

// Уведомления
const showNotification = (type, title, message) => {
  notification.value = {
    show: true,
    type,
    title,
    message,
  };
  setTimeout(() => {
    notification.value.show = false;
  }, 5000);
};

// Инициализация
onMounted(() => {
  loadBanks();
  loadCategories();
});
</script>
