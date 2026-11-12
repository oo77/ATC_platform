<template>
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Loading -->
    <div v-if="loading" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400 font-medium">Загрузка банка вопросов...</p>
      </div>
    </div>

    <!-- Error -->
    <div v-else-if="error || !bank" class="flex items-center justify-center min-h-[400px]">
      <div class="text-center max-w-md">
        <div class="bg-gray-100 dark:bg-gray-800 p-6 rounded-full inline-block mb-6 text-gray-400">
          <Library class="w-12 h-12" />
        </div>
        <h3 class="text-2xl font-bold text-gray-900 dark:text-white">{{ error || "Банк не найден" }}</h3>
        <UiButton class="mt-8" @click="navigateTo('/test-bank')">К списку банков</UiButton>
      </div>
    </div>

    <template v-else>
      <!-- Единый заголовок: крошки вместо крупной «Назад», статус и код в мета-строке -->
      <UiPageHeader
        :title="bank.name"
        :breadcrumbs="[{ label: 'Банк тестов', to: '/test-bank' }, { label: bank.code || bank.name }]"
      >
        <template #badge>
          <UiBadge size="sm" :color="bank.is_active ? 'success' : 'light'">{{ bank.is_active ? 'Активен' : 'Неактивен' }}</UiBadge>
        </template>
        <template #meta>
          <span class="rounded bg-gray-100 px-2 py-0.5 font-mono text-xs dark:bg-white/[0.06]">{{ bank.code }}</span>
          <span v-if="bank.category" class="flex items-center gap-1"><Tags class="h-3.5 w-3.5" /> {{ bank.category }}</span>
          <span>{{ bank.questions_count || 0 }} вопросов</span>
        </template>
        <!-- Действия только в шапке (дубль из сайдбара убран): главное — «Добавить вопрос», остальное — в «Импорт» и «⋯» -->
        <template #actions>
          <UiButton v-if="canManageTestBanks" variant="outline" size="sm" @click="showImportModal = true">
            <Upload class="mr-1.5 h-4 w-4" /> Импорт
          </UiButton>
          <UiButton v-if="canManageTestBanks" size="sm" @click="openCreateQuestionModal">
            <Plus class="mr-1.5 h-4 w-4" /> Добавить вопрос
          </UiButton>
          <UiDropdown
            v-if="canManageTestBanks"
            icon-only
            aria-label="Действия с банком"
            :groups="[{ items: [{ key: 'edit-bank', label: 'Редактировать банк', icon: Pencil }] }]"
            @select="openEditBankModal"
          />
        </template>
      </UiPageHeader>

      <!-- Метрики одной строкой UiStat: всего + сложность + языки (вместо двух рядов карточек с text-[11px] CAPS) -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
        <UiStat label="Всего" :value="stats.total" :icon="HelpCircle" tone="primary" />
        <UiStat label="Лёгкие" :value="stats.difficulty.easy" :icon="Zap" tone="success" />
        <UiStat label="Средние" :value="stats.difficulty.medium" :icon="TrendingUp" tone="warning" />
        <UiStat label="Сложные" :value="stats.difficulty.hard" :icon="Flame" tone="danger" />
        <UiStat v-for="lang in languageStats" :key="lang.code" :label="`${lang.flag} ${lang.label}`" :value="lang.count" />
      </div>

      <!-- Вкладки: UiTabs вместо «сегмента» с заливкой -->
      <UiTabs v-model="activeTab" :tabs="availableTabs" />

      <!-- Основная колонка + узкий сайдбар с аналитикой -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div class="space-y-4 lg:col-span-8">
          <!-- ВКЛАДКА «ВОПРОСЫ» -->
          <div v-show="activeTab === 'questions'" class="space-y-4">
            <!-- Единый блок фильтров: поиск + «Фильтры» (тип, сложность) + чипы; прежние ref и сброс сохранены -->
            <UiFilterBar
              :search="questionFilters.search"
              search-placeholder="Поиск по вопросам..."
              :debounce="0"
              :active-count="(questionFilters.type ? 1 : 0) + (questionFilters.difficulty ? 1 : 0)"
              :total="pagination.total"
              :chips="questionFilterChips"
              persist-key="test-bank-questions"
              @update:search="questionFilters.search = $event"
              @remove="questionFilters[$event] = ''"
              @reset="resetQuestionFilters"
            >
              <template #filters>
                <select v-model="questionFilters.type" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900">
                  <option value="">Тип</option>
                  <option value="single">Один</option>
                  <option value="multiple">Несколько</option>
                  <option value="text">Текст</option>
                </select>
                <select v-model="questionFilters.difficulty" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm outline-none focus:border-primary dark:border-gray-700 dark:bg-gray-900">
                  <option value="">Сложность</option>
                  <option value="easy">Лёгкий</option>
                  <option value="medium">Средний</option>
                  <option value="hard">Сложный</option>
                </select>
              </template>
            </UiFilterBar>

            <!-- Список вопросов: карточка с пагинацией-футером внутри -->
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div v-if="questionsLoading" class="p-12 text-center">
                <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              </div>
              <UiEmptyState v-else-if="questions.length === 0" :icon="HelpCircle" title="Нет вопросов" />
              <div v-else class="max-h-[560px] divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800">
                <div v-for="(q, idx) in questions" :key="q.id" class="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.04]">
                  <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
                    {{ (pagination.page - 1) * pagination.limit + idx + 1 }}
                  </span>
                  <div class="min-w-0 flex-1">
                    <p class="line-clamp-2 text-sm font-medium text-gray-800 dark:text-gray-200">{{ q.question_text }}</p>
                    <div class="mt-1 flex flex-wrap items-center gap-2">
                      <span :class="['rounded px-1.5 py-0.5 text-[11px] font-medium', difficultyClasses[q.difficulty]]">{{ difficultyLabels[q.difficulty] }}</span>
                      <span class="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary">{{ questionTypeLabels[q.question_type] }}</span>
                      <span class="text-[11px] text-gray-400">{{ languageFlags[q.language] }} {{ q.points }}б</span>
                      <span v-if="!q.is_active" class="text-[11px] text-gray-400">· неактивен</span>
                    </div>
                  </div>
                  <!-- Действия строки только для тех, у кого есть право canManageTestBanks: 1 иконка + «⋯»; на touch видны всегда -->
                  <div
                    v-if="canManageTestBanks"
                    class="flex shrink-0 items-center gap-1 opacity-100 transition-opacity focus-within:opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                  >
                    <UiButton variant="ghost" size="xs" icon title="Редактировать" aria-label="Редактировать" @click="openEditQuestionModal(q)">
                      <Pencil class="h-4 w-4" />
                    </UiButton>
                    <UiDropdown icon-only aria-label="Ещё" :groups="questionActions(q)" @select="onQuestionAction(q, $event)" />
                  </div>
                </div>
              </div>

              <!-- Пагинация внутри карточки (вместо самописной ←/→) -->
              <UiPagination
                v-if="pagination.totalPages > 1"
                :current-page="pagination.page"
                :total-pages="pagination.totalPages"
                :total="pagination.total"
                :limit="pagination.limit"
                :loading="questionsLoading"
                hide-limit
                @update:page="pagination.page = $event; loadQuestions()"
              />
            </div>
          </div>

          <!-- ВКЛАДКА «НАСТРОЙКИ» -->
          <div v-show="activeTab === 'settings'">
            <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                <Settings class="h-4 w-4 text-primary" />
                <h3 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Настройки банка</h3>
              </div>
              <div class="space-y-1 p-4">
                <div class="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span class="text-sm text-gray-500">Название</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ bank.name }}</span>
                </div>
                <div class="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span class="text-sm text-gray-500">Код</span>
                  <span class="font-mono text-sm font-medium text-gray-800 dark:text-gray-200">{{ bank.code }}</span>
                </div>
                <div class="flex items-center justify-between border-b border-gray-100 py-2 dark:border-gray-800">
                  <span class="text-sm text-gray-500">Категория</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ bank.category || '—' }}</span>
                </div>
                <div class="flex items-center justify-between py-2">
                  <span class="text-sm text-gray-500">Вопросов</span>
                  <span class="text-sm font-medium text-gray-800 dark:text-gray-200">{{ bank.questions_count || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Сайдбар: только аналитика (блок «Действия» убран — дублировал кнопки в шапке) -->
        <div class="space-y-4 lg:col-span-4">
          <!-- Распределение по сложности -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <BarChart3 class="h-4 w-4 text-info" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Распределение</h4>
            </div>
            <div class="space-y-3 p-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Лёгкие</span>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div class="h-full rounded-full bg-success" :style="{ width: `${stats.total ? (stats.difficulty.easy / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="w-8 text-xs font-semibold text-gray-600 dark:text-gray-400">{{ stats.difficulty.easy }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Средние</span>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div class="h-full rounded-full bg-warning" :style="{ width: `${stats.total ? (stats.difficulty.medium / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="w-8 text-xs font-semibold text-gray-600 dark:text-gray-400">{{ stats.difficulty.medium }}</span>
                </div>
              </div>
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-500">Сложные</span>
                <div class="flex items-center gap-2">
                  <div class="h-2 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                    <div class="h-full rounded-full bg-danger" :style="{ width: `${stats.total ? (stats.difficulty.hard / stats.total * 100) : 0}%` }"></div>
                  </div>
                  <span class="w-8 text-xs font-semibold text-gray-600 dark:text-gray-400">{{ stats.difficulty.hard }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Использование в шаблонах -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
            <div class="flex items-center gap-2 border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <FileText class="h-4 w-4 text-primary" />
              <h4 class="text-sm font-semibold text-gray-800 dark:text-gray-200">Шаблоны</h4>
            </div>
            <div class="p-4 text-center">
              <p class="text-2xl font-semibold text-primary">{{ bank.templates_count || 0 }}</p>
              <p class="text-xs text-gray-500">шаблонов используют этот банк</p>
            </div>
          </div>
        </div>
      </div>
    </template>

    <!-- Question Modal -->
    <UiModal :is-open="questionModalOpen" :title="editingQuestion ? 'Редактировать вопрос' : 'Добавить вопрос'" size="lg" @close="closeQuestionModal">
      <form @submit.prevent class="space-y-4">
        <div class="grid grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5">Тип</label>
            <select v-model="questionForm.question_type" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option value="single">Один ответ</option>
              <option value="multiple">Несколько</option>
              <option value="text">Текст</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5">Язык</label>
            <select v-model="questionForm.language" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option v-for="lang in TEST_LANGUAGES" :key="lang.value" :value="lang.value">{{ lang.flag }} {{ lang.label }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5">Сложность</label>
            <select v-model="questionForm.difficulty" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-4 pr-8 text-sm outline-none focus:border-primary appearance-none">
              <option value="easy">Лёгкий</option>
              <option value="medium">Средний</option>
              <option value="hard">Сложный</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-bold text-gray-500 mb-1.5">Баллы</label>
            <input v-model.number="questionForm.points" type="number" min="1" class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 pl-3 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1.5">Текст <span class="text-danger">*</span></label>
          <textarea v-model="questionForm.question_text" rows="2" placeholder="Введите вопрос..." class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 px-3 text-sm outline-none focus:border-primary resize-none" :class="{ 'border-danger': questionFormErrors.question_text }"></textarea>
          <p v-if="questionFormErrors.question_text" class="mt-1 text-xs text-danger">{{ questionFormErrors.question_text }}</p>
        </div>

        <div v-if="questionForm.question_type === 'single'" class="space-y-2">
          <label class="block text-xs font-bold text-gray-500">Варианты <span class="text-danger">*</span></label>
          <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
            <div v-for="(opt, idx) in questionForm.options" :key="opt.id" class="flex items-center gap-2">
              <button type="button" @click="setCorrectOption(idx)" :class="['w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0', opt.correct ? 'border-success bg-success' : 'border-gray-300']">
                <Check v-if="opt.correct" class="w-3 h-3 text-white" />
              </button>
              <span class="w-6 h-6 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{{ String.fromCharCode(65 + idx) }}</span>
              <input v-model="opt.text" type="text" :placeholder="`Вариант ${String.fromCharCode(65 + idx)}`" class="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2 px-3 text-sm outline-none focus:border-primary" :class="{ 'border-success': opt.correct }" />
              <button v-if="questionForm.options.length > 2" type="button" @click="removeOption(idx)" class="p-1 text-gray-400 hover:text-danger">
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>
          <button v-if="questionForm.options.length < 8" type="button" @click="addOption" class="text-xs font-bold text-primary flex items-center gap-1">
            <Plus class="w-3 h-3" /> Добавить вариант
          </button>
          <p v-if="questionFormErrors.options" class="mt-1 text-xs text-danger">{{ questionFormErrors.options }}</p>
        </div>

        <div>
          <label class="block text-xs font-bold text-gray-500 mb-1.5">Объяснение</label>
          <textarea v-model="questionForm.explanation" rows="1" placeholder="Комментарий к ответу..." class="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 px-3 text-sm outline-none focus:border-primary resize-none"></textarea>
        </div>

        <div class="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <label class="relative inline-flex items-center cursor-pointer">
            <input v-model="questionForm.is_active" type="checkbox" class="sr-only peer" />
            <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/25 rounded-full peer dark:bg-gray-700 peer-checked:after:trangray-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Активен</span>
        </div>
      </form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UiButton variant="outline" @click="closeQuestionModal">Отмена</UiButton>
          <UiButton :loading="savingQuestion" @click="saveQuestion">{{ editingQuestion ? "Сохранить" : "Добавить" }}</UiButton>
        </div>
      </template>
    </UiModal>

    <!-- Import Modal -->
    <TestBankImportQuestionsModal v-if="showImportModal" :bank-id="route.params.id" @close="showImportModal = false" @imported="onQuestionsImported" />

    <!-- Delete Confirmation -->
    <UiConfirmModal :is-open="deleteQuestionModalOpen" title="Удалить вопрос?" message="Это действие нельзя отменить." variant="danger" :loading="deletingQuestion" @confirm="deleteQuestion" @cancel="deleteQuestionModalOpen = false" />

    <!-- Notifications -->
    <UiNotification v-if="notification.show" :type="notification.type" :title="notification.title" :message="notification.message" @close="notification.show = false" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { TEST_LANGUAGES, TEST_LANGUAGE_FLAGS, emptyLanguageCounts } from "../../../shared/utils/testLanguages";
import {
  ArrowLeft, Library, Plus, Upload, HelpCircle, Zap, TrendingUp, Flame, Tags, Search,
  ChevronDown, Filter, RotateCcw, Pencil, CheckCircle, XCircle, Trash2, Check, X,
  ExternalLink, Settings, BarChart3, FileText, Grid, Info
} from "lucide-vue-next";

const route = useRoute();
definePageMeta({ layout: "default" });

const { authFetch } = useAuthFetch();
const { canManageTestBanks } = usePermissions();

const loading = ref(true);
const questionsLoading = ref(false);
const savingQuestion = ref(false);
const deletingQuestion = ref(false);
const error = ref(null);

const bank = ref<any>(null);
const questions = ref<any[]>([]);
const stats = ref({ total: 0, difficulty: { easy: 0, medium: 0, hard: 0 }, language: emptyLanguageCounts() as Record<string, number> });

const activeTab = ref("questions");
const availableTabs = [
  { id: "questions", label: "Вопросы", icon: HelpCircle },
  { id: "settings", label: "Настройки", icon: Settings },
];

const questionFilters = ref({ search: "", type: "", difficulty: "" });
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

// Чипы активных фильтров для UiFilterBar (только отображение; значения берутся из прежнего questionFilters)
const questionFilterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  const typeLabels: Record<string, string> = { single: "Один", multiple: "Несколько", text: "Текст" };
  const diffLabels: Record<string, string> = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
  if (questionFilters.value.type) chips.push({ key: "type", label: `Тип: ${typeLabels[questionFilters.value.type] || questionFilters.value.type}` });
  if (questionFilters.value.difficulty) chips.push({ key: "difficulty", label: `Сложность: ${diffLabels[questionFilters.value.difficulty] || questionFilters.value.difficulty}` });
  return chips;
});

// Пункты «⋯» для строки вопроса: переключение активности и удаление (опасное — последним, danger)
const questionActions = (q: any) => [
  { items: [{ key: "toggle", label: q.is_active ? "Деактивировать" : "Активировать", icon: q.is_active ? XCircle : CheckCircle }] },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];
// Маршрутизация выбранного пункта в прежние обработчики (логика toggleQuestionActive / confirmDeleteQuestion не менялась)
const onQuestionAction = (q: any, key: string) => {
  if (key === "toggle") toggleQuestionActive(q);
  else if (key === "delete") confirmDeleteQuestion(q);
};

const hasActiveQuestionFilters = computed(() => questionFilters.value.search || questionFilters.value.type || questionFilters.value.difficulty);

const languageStats = computed(() =>
  TEST_LANGUAGES.map((l) => ({
    code: l.value,
    flag: l.flag,
    label: l.label,
    count: (stats.value.language as Record<string, number>)[l.value] || 0,
  })),
);

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

const difficultyLabels = { easy: "Лёгкий", medium: "Средний", hard: "Сложный" };
const difficultyClasses = { easy: "bg-success/10 text-success", medium: "bg-warning/10 text-warning", hard: "bg-danger/10 text-danger" };
const questionTypeLabels = { single: "Один", multiple: "Несколько", text: "Текст" };
const languageFlags: Record<string, string> = TEST_LANGUAGE_FLAGS;

const questionModalOpen = ref(false);
const deleteQuestionModalOpen = ref(false);
const showImportModal = ref(false);
const editingQuestion = ref(null);
const deletingQuestionData = ref(null);

const questionForm = ref({ question_type: "single", question_text: "", options: [{ id: "a", text: "", correct: true }, { id: "b", text: "", correct: false }], language: "ru", points: 1, difficulty: "medium", explanation: "", is_active: true });
const questionFormErrors = ref({ question_text: "", options: "" });

const notification = ref({ show: false, type: "success", title: "", message: "" });

const loadBank = async () => {
  loading.value = true;
  try {
    const r = await authFetch(`/api/test-bank/banks/${route.params.id}`);
    if (r.success) {
      bank.value = r.bank;
      if (r.stats) stats.value = r.stats;
      await loadQuestions();
    } else error.value = r.message;
  } catch (e) { error.value = "Ошибка загрузки"; }
  finally { loading.value = false; }
};

const loadQuestions = async () => {
  questionsLoading.value = true;
  try {
    const params: any = { bank_id: route.params.id, page: pagination.value.page, limit: pagination.value.limit };
    if (questionFilters.value.search) params.search = questionFilters.value.search;
    if (questionFilters.value.type) params.question_type = questionFilters.value.type;
    if (questionFilters.value.difficulty) params.difficulty = questionFilters.value.difficulty;

    const r = await authFetch("/api/test-bank/questions", { params });
    if (r.success) { questions.value = r.questions; pagination.value.total = r.total; pagination.value.totalPages = r.totalPages; }
  } catch (e) { console.error(e); }
  finally { questionsLoading.value = false; }
};

watch(questionFilters, () => { pagination.value.page = 1; loadQuestions(); }, { deep: true });

const resetQuestionFilters = () => { questionFilters.value = { search: "", type: "", difficulty: "" }; };

const openCreateQuestionModal = () => {
  editingQuestion.value = null;
  questionForm.value = { question_type: "single", question_text: "", options: [{ id: "a", text: "", correct: true }, { id: "b", text: "", correct: false }], language: "ru", points: 1, difficulty: "medium", explanation: "", is_active: true };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const openEditQuestionModal = (q: any) => {
  editingQuestion.value = q;
  const opts = q.options ? (typeof q.options === "string" ? JSON.parse(q.options) : q.options).options || [] : [];
  questionForm.value = { question_type: q.question_type, question_text: q.question_text, options: opts.length ? opts : [{ id: "a", text: "", correct: true }], language: q.language || "ru", points: q.points, difficulty: q.difficulty, explanation: q.explanation || "", is_active: q.is_active };
  questionFormErrors.value = { question_text: "", options: "" };
  questionModalOpen.value = true;
};

const closeQuestionModal = () => { questionModalOpen.value = false; editingQuestion.value = null; };

const setCorrectOption = (idx: number) => { questionForm.value.options.forEach((o: any, i: number) => { o.correct = i === idx; }); };

const addOption = () => {
  const letters = "abcdefgh";
  questionForm.value.options.push({ id: letters[questionForm.value.options.length], text: "", correct: false });
};

const removeOption = (idx: number) => {
  const wasCorrect = questionForm.value.options[idx].correct;
  questionForm.value.options.splice(idx, 1);
  if (wasCorrect && questionForm.value.options.length > 0) questionForm.value.options[0].correct = true;
  questionForm.value.options.forEach((o: any, i: number) => { o.id = "abcdefgh"[i]; });
};

const validateQuestionForm = () => {
  questionFormErrors.value = { question_text: "", options: "" };
  let valid = true;
  if (!questionForm.value.question_text.trim()) { questionFormErrors.value.question_text = "Текст вопроса обязателен"; valid = false; }
  if (questionForm.value.question_type === "single") {
    const filled = questionForm.value.options.filter((o: any) => o.text.trim());
    if (filled.length < 2) { questionFormErrors.value.options = "Минимум 2 варианта"; valid = false; }
    if (!questionForm.value.options.some((o: any) => o.correct && o.text.trim())) { questionFormErrors.value.options = "Выберите правильный ответ"; valid = false; }
  }
  return valid;
};

const saveQuestion = async () => {
  if (!validateQuestionForm()) return;
  savingQuestion.value = true;
  try {
    const filteredOptions = questionForm.value.options.filter((o: any) => o.text.trim());
    const payload = { bank_id: route.params.id, question_type: questionForm.value.question_type, question_text: questionForm.value.question_text.trim(), options: { options: filteredOptions }, language: questionForm.value.language, points: questionForm.value.points, difficulty: questionForm.value.difficulty, explanation: questionForm.value.explanation.trim() || undefined, is_active: questionForm.value.is_active };
    const r = editingQuestion.value ? await authFetch(`/api/test-bank/questions/${editingQuestion.value.id}`, { method: "PUT", body: payload }) : await authFetch("/api/test-bank/questions", { method: "POST", body: payload });
    if (r.success) { showNotification("success", "Успешно", editingQuestion.value ? "Вопрос обновлён" : "Вопрос добавлен"); closeQuestionModal(); loadQuestions(); loadBank(); }
    else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка сохранения"); }
  finally { savingQuestion.value = false; }
};

const toggleQuestionActive = async (q: any) => {
  const r = await authFetch(`/api/test-bank/questions/${q.id}`, { method: "PUT", body: { is_active: !q.is_active } });
  if (r.success) { q.is_active = !q.is_active; showNotification("success", "Успешно", q.is_active ? "Активирован" : "Деактивирован"); }
  else showNotification("error", "Ошибка", r.message);
};

const confirmDeleteQuestion = (q: any) => { deletingQuestionData.value = q; deleteQuestionModalOpen.value = true; };

const deleteQuestion = async () => {
  if (!deletingQuestionData.value) return;
  deletingQuestion.value = true;
  try {
    const r = await authFetch(`/api/test-bank/questions/${deletingQuestionData.value.id}`, { method: "DELETE" });
    if (r.success) { showNotification("success", "Успешно", "Вопрос удалён"); deleteQuestionModalOpen.value = false; loadQuestions(); loadBank(); }
    else showNotification("error", "Ошибка", r.message);
  } catch (e) { console.error(e); showNotification("error", "Ошибка", "Ошибка удаления"); }
  finally { deletingQuestion.value = false; }
};

const onQuestionsImported = () => { showImportModal.value = false; loadQuestions(); loadBank(); showNotification("success", "Успешно", "Импорт завершён"); };

const openEditBankModal = () => { /* TODO: implement bank edit */ };

const showNotification = (type: string, title: string, message: string) => {
  notification.value = { show: true, type, title, message };
  setTimeout(() => { notification.value.show = false; }, 5000);
};

onMounted(() => { loadBank(); });
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { height: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
</style>