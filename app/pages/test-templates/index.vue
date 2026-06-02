<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div class="space-y-2">
          <h1 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Шаблоны тестов
          </h1>
          <p class="text-slate-500 font-medium">
            Управление шаблонами тестирования
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <UiButton
            v-if="canManageTestTemplates"
            variant="primary"
            size="sm"
            class="h-10 px-4 gap-2 font-bold shadow-sm"
            @click="openCreateModal"
          >
            <Plus class="w-4 h-4" />
            Создать шаблон
          </UiButton>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Всего шаблонов</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalTemplates }}</h3>
          </div>
          <div class="rounded-xl bg-primary/10 p-3 text-primary transition-transform group-hover:rotate-12">
            <FileText class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Активных</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.activeTemplates }}</h3>
          </div>
          <div class="rounded-xl bg-success/10 p-3 text-success transition-transform group-hover:rotate-12">
            <CheckCircle class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Банков</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalBanks }}</h3>
          </div>
          <div class="rounded-xl bg-warning/10 p-3 text-warning transition-transform group-hover:rotate-12">
            <Library class="w-6 h-6" />
          </div>
        </div>
      </div>

      <div class="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 transition-all hover:shadow-xl dark:hover:bg-slate-800/50">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-500 dark:text-slate-400">Языков</p>
            <h3 class="mt-1 text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalLanguages }}</h3>
          </div>
          <div class="rounded-xl bg-info/10 p-3 text-info transition-transform group-hover:rotate-12">
            <Globe class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>

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
        <div class="relative max-w-xl">
          <input
            v-model="filters.search"
            type="text"
            placeholder="Поиск по названию, коду шаблона..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-3 pl-12 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
            @input="handleFilterChange"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Library class="w-3.5 h-3.5" />
              Банк вопросов
            </label>
            <div class="relative">
              <select
                v-model="filters.bank_id"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все банки</option>
                <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }}</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

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

          <div class="space-y-3">
            <label class="flex text-xs font-bold text-slate-400 uppercase tracking-widest items-center gap-2">
              <Globe class="w-3.5 h-3.5" />
              Язык
            </label>
            <div class="relative">
              <select
                v-model="filters.language"
                class="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-slate-700 dark:bg-slate-800 appearance-none font-medium text-sm"
                @change="handleFilterChange"
              >
                <option value="">Все языки</option>
                <option value="ru">🇷🇺 Русский</option>
                <option value="uz">🇺🇿 Узбекский</option>
                <option value="en">🇬🇧 Английский</option>
              </select>
              <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      <div v-if="loading" class="p-12 text-center">
        <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-medium tracking-wide">
          Загрузка шаблонов...
        </p>
      </div>

      <div
        v-else-if="templates.length === 0"
        class="py-20 px-6 text-center text-slate-500 dark:text-slate-400"
      >
        <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText class="h-10 w-10 text-slate-400" />
        </div>
        <h3 class="text-xl font-bold text-slate-900 dark:text-white mb-2">Шаблоны тестов не найдены</h3>
        <p class="max-w-md mx-auto text-slate-500">
          Создайте первый шаблон теста, нажав кнопку "Создать шаблон" в правом верхнем углу
        </p>
      </div>

      <div v-else class="overflow-x-auto custom-scrollbar">
        <table class="w-full text-left border-collapse">
          <thead>
            <tr class="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Шаблон</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Код</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Банк</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Проходной балл</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-center">Языки</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Статус</th>
              <th class="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap text-right">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-800">
            <tr
              v-for="template in templates"
              :key="template.id"
              class="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-4">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold shadow-inner border border-primary/10">
                    <FileText class="w-5 h-5" />
                  </div>
                  <div>
                    <h5 class="font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                      {{ template.name }}
                    </h5>
                    <p v-if="template.description" class="text-sm text-slate-500 line-clamp-1 max-w-xs">
                      {{ template.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 align-middle">
                <span class="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                  {{ template.code }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle">
                <span v-if="template.bank_name" class="inline-flex items-center rounded-full bg-info/10 px-2.5 py-1 text-xs font-bold text-info">
                  {{ template.bank_name }}
                </span>
                <span v-else class="text-slate-400 font-medium">—</span>
              </td>
              <td class="px-6 py-4 align-middle text-center">
                <span class="inline-flex items-center justify-center min-w-10 rounded-full bg-primary/10 px-2.5 py-1 text-sm font-bold text-primary">
                  {{ template.passing_score }}%
                </span>
              </td>
              <td class="px-6 py-4 align-middle">
                <div class="flex items-center gap-1 justify-center">
                  <span
                    v-for="lang in (template.allowed_languages || ['ru'])"
                    :key="lang"
                    class="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm"
                    :class="languageBadgeClasses[lang]"
                    :title="languageLabels[lang]"
                  >
                    {{ languageFlags[lang] }}
                  </span>
                </div>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <span
                  :class="[
                    'inline-flex items-center rounded-full px-3 py-1 text-xs font-bold tracking-wide uppercase',
                    template.is_active
                      ? 'bg-success/10 text-success'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                  ]"
                >
                  {{ template.is_active ? 'Активен' : 'Неактивен' }}
                </span>
              </td>
              <td class="px-6 py-4 align-middle text-right">
                <div class="flex items-center justify-end gap-1">
                  <button
                    @click="viewTemplate(template)"
                    class="p-2 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                    title="Просмотр"
                  >
                    <Eye class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTestTemplates"
                    @click="openEditModal(template)"
                    class="p-2 text-slate-500 hover:text-warning hover:bg-warning/10 rounded-xl transition-colors"
                    title="Редактировать"
                  >
                    <Pencil class="w-5 h-5" />
                  </button>
                  <button
                    v-if="canManageTestTemplates"
                    @click="confirmDelete(template)"
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

    <UiModal
      :is-open="modalOpen"
      :title="editingTemplate ? 'Редактировать шаблон' : 'Создать шаблон'"
      size="lg"
      @close="closeModal"
    >
      <form @submit.prevent="saveTemplate" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Название <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.name"
              type="text"
              placeholder="Например: Тест по охране труда"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium"
              :class="{ 'border-danger ring-2 ring-danger/10': formErrors.name }"
            />
            <p v-if="formErrors.name" class="mt-1 text-sm text-danger font-medium">{{ formErrors.name }}</p>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Код <span class="text-danger">*</span>
            </label>
            <input
              v-model="form.code"
              type="text"
              placeholder="Например: OT-TEST-001"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium uppercase"
              :class="{ 'border-danger ring-2 ring-danger/10': formErrors.code }"
            />
            <p v-if="formErrors.code" class="mt-1 text-sm text-danger font-medium">{{ formErrors.code }}</p>
          </div>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Банк вопросов <span class="text-danger">*</span>
          </label>
          <div class="relative">
            <select
              v-model="form.bank_id"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 pl-4 pr-10 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 appearance-none font-medium"
              :class="{ 'border-danger ring-2 ring-danger/10': formErrors.bank_id }"
            >
              <option value="">Выберите банк вопросов</option>
              <option v-for="bank in banks" :key="bank.id" :value="bank.id">{{ bank.name }} ({{ bank.code }})</option>
            </select>
            <ChevronDown class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          <p v-if="formErrors.bank_id" class="mt-1 text-sm text-danger font-medium">{{ formErrors.bank_id }}</p>
        </div>

        <div>
          <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
            Описание
          </label>
          <textarea
            v-model="form.description"
            rows="2"
            placeholder="Краткое описание шаблона теста..."
            class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 dark:border-slate-700 transition-all font-medium resize-none"
          ></textarea>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Время (мин)
            </label>
            <input
              v-model.number="form.time_limit_minutes"
              type="number"
              min="0"
              placeholder="0"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium"
            />
            <p class="mt-1 text-xs text-slate-500 font-medium">0 = без лимита</p>
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Проходной балл %
            </label>
            <input
              v-model.number="form.passing_score"
              type="number"
              min="1"
              max="100"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Макс попыток
            </label>
            <input
              v-model.number="form.max_attempts"
              type="number"
              min="1"
              class="w-full rounded-xl border border-slate-200 bg-slate-50/50 dark:bg-slate-800/50 py-2.5 px-4 outline-none focus:border-primary dark:border-slate-700 font-medium"
            />
          </div>

          <div>
            <label class="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              Активен
            </label>
            <div class="flex items-center h-full pt-2">
              <label class="relative inline-flex items-center cursor-pointer">
                <input v-model="form.is_active" type="checkbox" class="sr-only peer" />
                <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeModal">
            Отмена
          </UiButton>
          <UiButton :loading="saving" @click="saveTemplate">
            {{ editingTemplate ? 'Сохранить' : 'Создать' }}
          </UiButton>
        </div>
      </template>
    </UiModal>

    <UiConfirmModal
      :is-open="deleteModalOpen"
      title="Удалить шаблон?"
      :message="`Вы уверены, что хотите удалить шаблон '${deletingTemplate?.name}'? Это действие нельзя отменить.`"
      confirm-text="Удалить"
      cancel-text="Отмена"
      variant="danger"
      :loading="deleting"
      @confirm="deleteTemplate"
      @cancel="deleteModalOpen = false"
    />

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
import { Plus, FileText, Library, CheckCircle, Globe, Filter, RotateCcw, Search, ChevronDown, Activity, Eye, Pencil, Trash2 } from 'lucide-vue-next';

definePageMeta({
  layout: 'default',
});

const { authFetch } = useAuthFetch();
const { canManageTestTemplates } = usePermissions();
const router = useRouter();

const loading = ref(false);
const saving = ref(false);
const deleting = ref(false);
const templates = ref([]);
const banks = ref([]);
const pagination = ref({
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
});

const filters = ref({
  search: '',
  bank_id: '',
  isActive: undefined,
  language: '',
});

const stats = computed(() => {
  const languages = new Set();
  templates.value.forEach(t => {
    (t.allowed_languages || ['ru']).forEach(l => languages.add(l));
  });
  return {
    totalTemplates: pagination.value.total,
    activeTemplates: templates.value.filter(t => t.is_active).length,
    totalBanks: banks.value.length,
    totalLanguages: languages.size,
  };
});

const hasActiveFilters = computed(() => {
  return filters.value.search !== '' ||
    filters.value.bank_id !== '' ||
    filters.value.isActive !== undefined ||
    filters.value.language !== '';
});

const modalOpen = ref(false);
const deleteModalOpen = ref(false);
const editingTemplate = ref(null);
const deletingTemplate = ref(null);

const form = ref({
  name: '',
  code: '',
  bank_id: '',
  description: '',
  time_limit_minutes: 0,
  passing_score: 70,
  max_attempts: 3,
  is_active: true,
});

const formErrors = ref({
  name: '',
  code: '',
  bank_id: '',
});

const notification = ref({
  show: false,
  type: 'success',
  title: '',
  message: '',
});

const languageLabels = { ru: 'Русский', uz: "O'zbek", en: 'English' };
const languageFlags = { ru: '🇷🇺', uz: '🇺🇿', en: '🇬🇧' };
const languageBadgeClasses = {
  ru: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  uz: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  en: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
};

const loadTemplates = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
    });

    if (filters.value.search) params.append('search', filters.value.search);
    if (filters.value.bank_id) params.append('bank_id', filters.value.bank_id);
    if (filters.value.isActive !== undefined) params.append('is_active', filters.value.isActive.toString());
    if (filters.value.language) params.append('language', filters.value.language);

    const response = await authFetch(`/api/test-bank/templates?${params.toString()}`);

    if (response.success) {
      templates.value = response.templates;
      pagination.value.total = response.total;
      pagination.value.totalPages = response.totalPages;
    }
  } catch (error) {
    console.error('Ошибка загрузки шаблонов:', error);
    showNotification('error', 'Ошибка', 'Не удалось загрузить шаблоны');
  } finally {
    loading.value = false;
  }
};

const loadBanks = async () => {
  try {
    const response = await authFetch('/api/test-bank/banks?limit=100');
    if (response.success) {
      banks.value = response.banks;
    }
  } catch (error) {
    console.error('Ошибка загрузки банков:', error);
  }
};

const handleFilterChange = () => {
  pagination.value.page = 1;
  loadTemplates();
};

const resetFilters = () => {
  filters.value = { search: '', bank_id: '', isActive: undefined, language: '' };
  pagination.value.page = 1;
  loadTemplates();
};

const changePage = (page) => {
  pagination.value.page = page;
  loadTemplates();
};

const viewTemplate = (template) => {
  navigateTo(`/test-templates/${template.id}`);
};

const openCreateModal = () => {
  editingTemplate.value = null;
  form.value = {
    name: '',
    code: '',
    bank_id: '',
    description: '',
    time_limit_minutes: 0,
    passing_score: 70,
    max_attempts: 3,
    is_active: true,
  };
  formErrors.value = { name: '', code: '', bank_id: '' };
  modalOpen.value = true;
};

const openEditModal = (template) => {
  editingTemplate.value = template;
  form.value = {
    name: template.name,
    code: template.code,
    bank_id: template.bank_id || '',
    description: template.description || '',
    time_limit_minutes: template.time_limit_minutes || 0,
    passing_score: template.passing_score || 70,
    max_attempts: template.max_attempts || 3,
    is_active: template.is_active,
  };
  formErrors.value = { name: '', code: '', bank_id: '' };
  modalOpen.value = true;
};

const closeModal = () => {
  modalOpen.value = false;
  editingTemplate.value = null;
};

const confirmDelete = (template) => {
  deletingTemplate.value = template;
  deleteModalOpen.value = true;
};

const validateForm = () => {
  formErrors.value = { name: '', code: '', bank_id: '' };
  let isValid = true;

  if (!form.value.name.trim()) {
    formErrors.value.name = 'Название обязательно';
    isValid = false;
  }

  if (!form.value.code.trim()) {
    formErrors.value.code = 'Код обязателен';
    isValid = false;
  } else if (!/^[A-Z0-9-]+$/i.test(form.value.code)) {
    formErrors.value.code = 'Только латинские буквы, цифры и дефис';
    isValid = false;
  }

  if (!form.value.bank_id) {
    formErrors.value.bank_id = 'Выберите банк вопросов';
    isValid = false;
  }

  return isValid;
};

const saveTemplate = async () => {
  if (!validateForm()) return;

  saving.value = true;
  try {
    const payload = {
      name: form.value.name.trim(),
      code: form.value.code.trim().toUpperCase(),
      bank_id: form.value.bank_id,
      description: form.value.description.trim() || undefined,
      time_limit_minutes: form.value.time_limit_minutes || 0,
      passing_score: form.value.passing_score || 70,
      max_attempts: form.value.max_attempts || 3,
      is_active: form.value.is_active,
    };

    let response;
    if (editingTemplate.value) {
      response = await authFetch(`/api/test-bank/templates/${editingTemplate.value.id}`, {
        method: 'PUT',
        body: payload,
      });
    } else {
      response = await authFetch('/api/test-bank/templates', {
        method: 'POST',
        body: payload,
      });
    }

    if (response.success) {
      showNotification('success', 'Успешно', editingTemplate.value ? 'Шаблон обновлён' : 'Шаблон создан');
      closeModal();
      loadTemplates();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось сохранить шаблон');
    }
  } catch (error) {
    console.error('Ошибка сохранения шаблона:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при сохранении');
  } finally {
    saving.value = false;
  }
};

const deleteTemplate = async () => {
  if (!deletingTemplate.value) return;

  deleting.value = true;
  try {
    const response = await authFetch(`/api/test-bank/templates/${deletingTemplate.value.id}`, {
      method: 'DELETE',
    });

    if (response.success) {
      showNotification('success', 'Успешно', 'Шаблон удалён');
      deleteModalOpen.value = false;
      deletingTemplate.value = null;
      loadTemplates();
    } else {
      showNotification('error', 'Ошибка', response.message || 'Не удалось удалить шаблон');
    }
  } catch (error) {
    console.error('Ошибка удаления шаблона:', error);
    showNotification('error', 'Ошибка', 'Произошла ошибка при удалении');
  } finally {
    deleting.value = false;
  }
};

const showNotification = (type, title, message) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => {
  loadTemplates();
  loadBanks();
});
</script>