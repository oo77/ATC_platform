<template>
  <div class="mx-auto max-w-screen-2xl space-y-5">
    <UiPageHeader title="Библиотека" description="Учебные материалы, доступные вам для чтения">
      <template #actions>
        <UiButton v-if="canManage" to="/admin/library/books" variant="outline" :start-icon="Settings2">
          Управление библиотекой
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Продолжить чтение -->
    <section
      v-if="hero && !hasFilters"
      class="overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-brand-50 via-white to-white dark:border-gray-800 dark:from-brand-500/10 dark:via-white/[0.02] dark:to-transparent"
    >
      <div class="grid gap-0 lg:grid-cols-[1fr_minmax(0,22rem)]">
        <!-- Главная книга -->
        <button
          type="button"
          class="group flex items-center gap-5 p-5 text-left sm:p-6"
          @click="openBook(hero)"
        >
          <LibraryBookCover
            :url="hero.cover_url"
            :title="hero.title"
            :author="hero.author"
            :width="160"
            class="w-24 shrink-0 transition-transform duration-300 group-hover:-translate-y-1 sm:w-28"
          />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-semibold uppercase tracking-wider text-brand-500">Продолжить чтение</p>
            <h2 class="mt-1 line-clamp-2 text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
              {{ hero.title }}
            </h2>
            <p class="mt-0.5 truncate text-sm text-gray-500 dark:text-gray-400">{{ hero.author || "Автор не указан" }}</p>
            <div class="mt-4 flex items-center gap-3">
              <div class="h-1.5 max-w-xs flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                <div class="h-full rounded-full bg-brand-500" :style="{ width: `${hero.progress.percentage}%` }" />
              </div>
              <span class="text-xs tabular-nums text-gray-500">{{ hero.progress.percentage }}%</span>
            </div>
            <span class="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors group-hover:bg-brand-600">
              <BookOpen class="h-4 w-4" />
              Страница {{ hero.progress.current_page || 1 }} из {{ hero.total_pages }}
            </span>
          </div>
        </button>

        <!-- Ещё начатые -->
        <div
          v-if="continueReading.length > 1"
          class="border-t border-gray-200/70 p-3 dark:border-gray-800 lg:border-l lg:border-t-0"
        >
          <p class="px-2 pb-1 pt-1 text-xs font-medium text-gray-500 dark:text-gray-400">Также читаете</p>
          <button
            v-for="b in continueReading.slice(1)"
            :key="b.id"
            type="button"
            class="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/80 dark:hover:bg-white/[0.04]"
            @click="openBook(b)"
          >
            <LibraryBookCover :url="b.cover_url" :title="b.title" :width="64" compact class="w-9 shrink-0" />
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ b.title }}</p>
              <div class="mt-1.5 flex items-center gap-2">
                <div class="h-1 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-white/10">
                  <div class="h-full rounded-full bg-brand-500" :style="{ width: `${b.progress.percentage}%` }" />
                </div>
                <span class="text-[11px] tabular-nums text-gray-500">{{ b.progress.percentage }}%</span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </section>

    <!-- Личная статистика -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <UiStat label="Доступно" :value="summary.available" :icon="Library" tone="primary" :loading="firstLoad" />
      <UiStat label="Читаю" :value="summary.reading" :icon="BookOpen" tone="info" :loading="firstLoad" clickable :active="shelf === 'reading'" @click="setShelf('reading')" />
      <UiStat label="Прочитано" :value="summary.completed" :icon="BookCheck" tone="success" :loading="firstLoad" clickable :active="shelf === 'completed'" @click="setShelf('completed')" />
      <UiStat label="Время чтения" :value="formatDuration(summary.totalSeconds)" :icon="Clock" tone="neutral" :loading="firstLoad" />
    </div>

    <!-- Полки -->
    <UiTabs :model-value="shelf" :tabs="shelfTabs" @update:model-value="setShelf" />

    <!-- Поиск и фильтры -->
    <UiFilterBar
      v-model:search="searchQuery"
      search-placeholder="Название, автор или ISBN…"
      :debounce="300"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="library"
      @search="onFilterChange"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #actions>
        <select
          v-model="sort"
          class="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
          aria-label="Сортировка"
          @change="onFilterChange"
        >
          <option value="title">По названию</option>
          <option value="recent">Недавно читал</option>
          <option value="added">Новые поступления</option>
          <option value="progress">По прогрессу</option>
        </select>
        <div class="hidden rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06] sm:flex" role="group" aria-label="Вид">
          <button
            v-for="v in viewModes"
            :key="v.id"
            type="button"
            :title="v.label"
            :aria-pressed="view === v.id"
            class="flex h-8 w-8 items-center justify-center rounded-md transition-colors"
            :class="view === v.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
            @click="setView(v.id)"
          >
            <component :is="v.icon" class="h-4 w-4" />
          </button>
        </div>
      </template>
      <template #filters>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Автор</span>
          <input
            v-model="author"
            list="library-authors"
            type="text"
            placeholder="Любой автор"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-100"
            @change="onFilterChange"
          />
          <datalist id="library-authors">
            <option v-for="a in authors" :key="a" :value="a" />
          </datalist>
        </label>
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Язык</span>
          <select
            v-model="language"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="onFilterChange"
          >
            <option v-for="l in languageOptions" :key="l.value" :value="l.value">{{ l.label }}</option>
          </select>
        </label>
      </template>
    </UiFilterBar>

    <!-- Загрузка (скелетон) -->
    <div v-if="loading && !books.length" class="grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      <div v-for="i in 12" :key="i" class="animate-pulse">
        <div class="aspect-[3/4] rounded-md bg-gray-200 dark:bg-white/[0.06]" />
        <div class="mt-3 h-3.5 w-4/5 rounded bg-gray-200 dark:bg-white/[0.06]" />
        <div class="mt-2 h-3 w-1/2 rounded bg-gray-100 dark:bg-white/[0.04]" />
      </div>
    </div>

    <!-- Пусто -->
    <div v-else-if="!books.length" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState :icon="BookX" :title="emptyState.title" :description="emptyState.text">
        <template v-if="hasFilters || shelf !== 'all'" #actions>
          <UiButton variant="outline" size="sm" @click="resetAll">Показать все книги</UiButton>
        </template>
      </UiEmptyState>
    </div>

    <template v-else>
      <!-- Сетка -->
      <div
        v-if="view === 'grid'"
        class="grid grid-cols-2 gap-x-4 gap-y-7 transition-opacity sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
        :class="{ 'opacity-60': loading }"
      >
        <button
          v-for="book in books"
          :key="book.id"
          type="button"
          class="group text-left focus:outline-none"
          @click="openBook(book)"
        >
          <LibraryBookCover
            :url="book.cover_url"
            :title="book.title"
            :author="book.author"
            class="transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg group-focus-visible:ring-2 group-focus-visible:ring-brand-500"
          >
            <!-- Бейджи -->
            <div class="absolute left-2 top-2 flex flex-col items-start gap-1">
              <span v-if="book.progress.completed" class="badge bg-success-500 text-white"><Check class="h-3 w-3" />Прочитано</span>
              <span v-else-if="book.isNew && !book.progress.current_page" class="badge bg-brand-500 text-white">Новинка</span>
            </div>
            <span v-if="book.expiresAt" class="badge absolute bottom-2 left-2 bg-black/70 text-white" :title="`Доступ до ${formatDate(book.expiresAt)}`">
              <Timer class="h-3 w-3" />до {{ formatDate(book.expiresAt, true) }}
            </span>
            <!-- Прогресс по нижнему краю обложки -->
            <div v-if="book.progress.current_page && !book.progress.completed" class="absolute inset-x-0 bottom-0 h-1 bg-black/20">
              <div class="h-full bg-brand-500" :style="{ width: `${book.progress.percentage}%` }" />
            </div>
            <!-- Действие при наведении -->
            <div class="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/60 via-black/0 to-transparent pb-4 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <span class="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-900 shadow">
                {{ book.progress.current_page && !book.progress.completed ? "Продолжить" : book.progress.completed ? "Перечитать" : "Читать" }}
              </span>
            </div>
          </LibraryBookCover>
          <h3 class="mt-3 line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-500 dark:text-white">
            {{ book.title }}
          </h3>
          <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{{ book.author || "Автор не указан" }}</p>
          <p class="mt-1 flex items-center gap-2 text-[11px] text-gray-400">
            <span>{{ book.total_pages }} стр.</span>
            <span v-if="book.language">· {{ langShort(book.language) }}</span>
            <span v-if="book.published_year">· {{ book.published_year }}</span>
            <span v-if="book.progress.current_page && !book.progress.completed" class="ml-auto font-medium tabular-nums text-brand-500">{{ book.progress.percentage }}%</span>
          </p>
        </button>
      </div>

      <!-- Список -->
      <div v-else class="overflow-hidden rounded-xl border border-gray-200 bg-white transition-opacity dark:border-gray-800 dark:bg-white/[0.03]" :class="{ 'opacity-60': loading }">
        <button
          v-for="book in books"
          :key="book.id"
          type="button"
          class="group flex w-full items-center gap-4 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
          @click="openBook(book)"
        >
          <LibraryBookCover :url="book.cover_url" :title="book.title" :width="80" compact class="w-10 shrink-0" />
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <h3 class="truncate text-sm font-semibold text-gray-900 group-hover:text-brand-500 dark:text-white">{{ book.title }}</h3>
              <UiBadge v-if="book.progress.completed" size="sm" color="success">Прочитано</UiBadge>
              <UiBadge v-else-if="book.isNew && !book.progress.current_page" size="sm" color="primary">Новинка</UiBadge>
            </div>
            <p class="mt-0.5 truncate text-xs text-gray-500">
              {{ book.author || "Автор не указан" }} · {{ book.total_pages }} стр.<template v-if="book.published_year"> · {{ book.published_year }}</template>
            </p>
          </div>
          <span class="hidden w-12 text-center text-xs font-medium text-gray-500 md:block">{{ langShort(book.language) }}</span>
          <span v-if="book.expiresAt" class="hidden items-center gap-1 text-xs text-warning-600 lg:flex"><Timer class="h-3.5 w-3.5" />до {{ formatDate(book.expiresAt) }}</span>
          <div class="hidden w-40 items-center justify-end gap-2 sm:flex">
            <template v-if="book.progress.current_page">
              <div class="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                <div class="h-full rounded-full" :class="book.progress.completed ? 'bg-success-500' : 'bg-brand-500'" :style="{ width: `${book.progress.percentage}%` }" />
              </div>
              <span class="w-9 text-right text-xs tabular-nums text-gray-500">{{ book.progress.percentage }}%</span>
            </template>
            <span v-else class="text-xs text-gray-400">Не начата</span>
          </div>
          <ChevronRight class="h-4 w-4 shrink-0 text-gray-300 group-hover:text-brand-500" />
        </button>
      </div>

      <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <UiPagination
          :current-page="pagination.page"
          :total-pages="Math.ceil(pagination.total / pagination.limit)"
          :total="pagination.total"
          :limit="pagination.limit"
          :limit-options="[12, 24, 48]"
          @update:page="onPageChange"
          @update:limit="onLimitChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import {
  Library, BookOpen, BookCheck, BookX, Clock, Check, Timer, ChevronRight, Settings2,
  LayoutGrid, List, BookMarked, Sparkles,
} from "lucide-vue-next";
import { useToast } from "~/composables/useToast";
import { usePermissions } from "~/composables/usePermissions";
import { Permission } from "~/types/permissions";

definePageMeta({ layout: "default" as any });
useHead({ title: "Библиотека" });

interface CatalogBook {
  id: string;
  title: string;
  author: string | null;
  language: string | null;
  cover_url: string | null;
  published_year: number | null;
  total_pages: number;
  isNew: boolean;
  expiresAt: string | null;
  progress: {
    current_page: number;
    max_page: number;
    percentage: number;
    lastReadAt: string | null;
    completed: boolean;
    totalSeconds: number;
  };
}

const router = useRouter();
const toast = useToast();
const { hasPermission } = usePermissions();
const canManage = computed(() => hasPermission(Permission.LIBRARY_MANAGE));

const languageOptions = [
  { value: "", label: "Все языки" },
  { value: "ru", label: "Русский" },
  { value: "uz", label: "O'zbekcha" },
  { value: "en", label: "English" },
  { value: "kk", label: "Қазақша" },
];
const langShort = (l: string | null) => (l ? l.toUpperCase() : "—");

// ---------- состояние ----------
const loading = ref(false);
const firstLoad = ref(true);
const books = ref<CatalogBook[]>([]);
const continueReading = ref<CatalogBook[]>([]);
const summary = ref({ available: 0, reading: 0, completed: 0, totalSeconds: 0 });
const authors = ref<string[]>([]);

const searchQuery = ref("");
const author = ref("");
const language = ref("");
const shelf = ref<"all" | "reading" | "completed" | "unread">("all");
const sort = ref("title");
const view = ref<"grid" | "list">("grid");
const pagination = ref({ page: 1, limit: 24, total: 0 });

const viewModes = [
  { id: "grid" as const, label: "Обложки", icon: LayoutGrid },
  { id: "list" as const, label: "Список", icon: List },
];

const hero = computed(() => continueReading.value[0] || null);
const hasFilters = computed(() => !!(searchQuery.value || author.value || language.value));

const shelfTabs = computed(() => [
  { id: "all", label: "Все книги", icon: Library, count: summary.value.available },
  { id: "reading", label: "Читаю", icon: BookMarked, count: summary.value.reading },
  { id: "completed", label: "Прочитанные", icon: BookCheck, count: summary.value.completed },
  {
    id: "unread",
    label: "Не начатые",
    icon: Sparkles,
    count: Math.max(summary.value.available - summary.value.reading - summary.value.completed, 0),
  },
]);

const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (searchQuery.value) chips.push({ key: "search", label: `Поиск: ${searchQuery.value}` });
  if (author.value) chips.push({ key: "author", label: `Автор: ${author.value}` });
  if (language.value) chips.push({ key: "language", label: `Язык: ${languageOptions.find((l) => l.value === language.value)?.label}` });
  return chips;
});

const emptyState = computed(() => {
  if (hasFilters.value) return { title: "Ничего не найдено", text: "Измените запрос или сбросьте фильтры" };
  if (shelf.value === "reading") return { title: "Вы пока ничего не читаете", text: "Откройте любую книгу — она появится здесь" };
  if (shelf.value === "completed") return { title: "Прочитанных книг пока нет", text: "Книга попадёт сюда, когда вы дойдёте до последней страницы" };
  if (shelf.value === "unread") return { title: "Все книги начаты", text: "Отличный результат!" };
  return { title: "Библиотека пуста", text: "Вам пока не выдали доступ к книгам. Обратитесь к куратору или администратору." };
});

// ---------- загрузка ----------
let requestId = 0;
const fetchBooks = async () => {
  const id = ++requestId;
  loading.value = true;
  try {
    const params: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      shelf: shelf.value,
      sort: sort.value,
    };
    if (searchQuery.value) params.search = searchQuery.value;
    if (author.value) params.author = author.value;
    if (language.value) params.language = language.value;

    const res = await $fetch<{
      books: CatalogBook[];
      total: number;
      summary: typeof summary.value;
      continueReading: CatalogBook[];
    }>("/api/library/catalog", { params });
    if (id !== requestId) return; // пришёл ответ на устаревший запрос
    books.value = res.books;
    pagination.value.total = res.total;
    summary.value = res.summary;
    if (pagination.value.page === 1) continueReading.value = res.continueReading;
  } catch (error: any) {
    if (id === requestId) toast.error(error?.data?.message || "Не удалось загрузить каталог");
  } finally {
    if (id === requestId) {
      loading.value = false;
      firstLoad.value = false;
    }
  }
};

const fetchAuthors = async () => {
  try {
    authors.value = (await $fetch<{ authors: string[] }>("/api/library/catalog/authors")).authors;
  } catch { /* подсказки не критичны */ }
};

// ---------- действия ----------
const onFilterChange = () => {
  pagination.value.page = 1;
  savePrefs();
  fetchBooks();
};
const setShelf = (value: string) => {
  shelf.value = (shelf.value === value && value !== "all" ? "all" : value) as typeof shelf.value;
  if (shelf.value === "reading" && sort.value === "title") sort.value = "recent";
  onFilterChange();
};
const setView = (v: "grid" | "list") => {
  view.value = v;
  savePrefs();
};
const removeFilterChip = (key: string) => {
  if (key === "search") searchQuery.value = "";
  if (key === "author") author.value = "";
  if (key === "language") language.value = "";
  onFilterChange();
};
const resetFilters = () => {
  searchQuery.value = "";
  author.value = "";
  language.value = "";
  onFilterChange();
};
const resetAll = () => {
  shelf.value = "all";
  resetFilters();
};
const onPageChange = (page: number) => {
  pagination.value.page = page;
  fetchBooks();
  window.scrollTo({ top: 0, behavior: "smooth" });
};
const onLimitChange = (limit: number) => {
  pagination.value.limit = limit;
  pagination.value.page = 1;
  savePrefs();
  fetchBooks();
};
const openBook = (book: { id: string }) => router.push(`/library/${book.id}`);

// ---------- форматирование ----------
const formatDuration = (sec: number) => {
  if (!sec) return "0 мин";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} ч ${m} мин` : `${Math.max(m, 1)} мин`;
};
const formatDate = (d: string, short = false) =>
  new Date(d).toLocaleDateString("ru-RU", short ? { day: "2-digit", month: "2-digit" } : { day: "2-digit", month: "2-digit", year: "numeric" });

// ---------- настройки вида (на устройство) ----------
const PREFS_KEY = "library:catalog-prefs";
const savePrefs = () => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ view: view.value, sort: sort.value, limit: pagination.value.limit }));
  } catch { /* приватный режим */ }
};
const loadPrefs = () => {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (p.view === "grid" || p.view === "list") view.value = p.view;
    if (["title", "recent", "added", "progress"].includes(p.sort)) sort.value = p.sort;
    if ([12, 24, 48].includes(p.limit)) pagination.value.limit = p.limit;
  } catch { /* приватный режим */ }
};

onMounted(() => {
  loadPrefs();
  fetchBooks();
  fetchAuthors();
});
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  padding: 0.125rem 0.5rem;
  font-size: 10px;
  font-weight: 600;
  line-height: 1.4;
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.15);
}
</style>
