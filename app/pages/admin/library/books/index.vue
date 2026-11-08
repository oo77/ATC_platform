<template>
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <UiPageHeader title="Управление библиотекой" description="Фонд, доступы читателей и статистика чтения">
      <template #actions>
        <UiButton variant="ghost" to="/library" :start-icon="Library">Каталог</UiButton>
        <UiButton variant="outline" :start-icon="Download" @click="exportBooks">Экспорт</UiButton>
        <UiButton variant="primary" :start-icon="Upload" @click="isUploadModalOpen = true">Загрузить книгу</UiButton>
      </template>
    </UiPageHeader>

    <UiTabs v-model="tab" :tabs="tabs" @update:model-value="onTabChange" />

    <!-- ================= Аналитика ================= -->
    <LibraryDashboard
      v-if="tab === 'analytics'"
      ref="dashboardRef"
      @filter-no-access="showWithoutAccess"
      @filter-failed="() => { tab = 'books'; selectStatus('failed'); }"
      @open-book="openAnalyticsById"
    />

    <!-- ================= Книги ================= -->
    <template v-else>
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <UiStat label="Всего книг" :value="totalAll" :icon="BookOpen" tone="primary" clickable :active="!filters.status && !filters.access" @click="selectStatus('')" />
        <UiStat label="Готовы к чтению" :value="stats.ready" :icon="CheckCircle2" tone="success" clickable :active="filters.status === 'ready'" @click="selectStatus('ready')" />
        <UiStat label="В обработке" :value="stats.processing" :icon="Clock" tone="warning" clickable :active="filters.status === 'processing'" @click="selectStatus('processing')" />
        <UiStat label="С ошибками" :value="stats.failed" :icon="AlertCircle" tone="danger" clickable :active="filters.status === 'failed'" @click="selectStatus('failed')" />
        <UiStat
          label="Без доступа"
          :value="stats.withoutAccess"
          :icon="ShieldAlert"
          :tone="stats.withoutAccess ? 'warning' : 'neutral'"
          hint="скрыты от читателей"
          clickable
          :active="filters.access === 'none'"
          @click="toggleWithoutAccess"
        />
      </div>

      <UiFilterBar
        v-model:search="filters.search"
        search-placeholder="Название, автор или ISBN…"
        :debounce="300"
        :chips="filterChips"
        :active-count="filterChips.length"
        :total="pagination.total"
        persist-key="admin-library-books"
        @search="handleFilterChange"
        @remove="removeFilterChip"
        @reset="resetFilters"
      >
        <template #actions>
          <select
            v-model="sortKey"
            class="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm text-gray-700 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
            aria-label="Сортировка"
            @change="handleFilterChange"
          >
            <option v-for="s in sortOptions" :key="s.value" :value="s.value">{{ s.label }}</option>
          </select>
        </template>
        <template #filters>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Автор</span>
            <input
              v-model="filters.author"
              list="admin-library-authors"
              type="text"
              placeholder="Любой автор"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-gray-100"
              @change="handleFilterChange"
            />
            <datalist id="admin-library-authors"><option v-for="a in authors" :key="a" :value="a" /></datalist>
          </label>
          <label class="block">
            <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Язык</span>
            <select
              v-model="filters.language"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              @change="handleFilterChange"
            >
              <option v-for="opt in languageOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
            </select>
          </label>
        </template>
      </UiFilterBar>

      <!-- Массовые действия -->
      <Transition name="slide-down">
        <div
          v-if="selectedBookIds.size > 0"
          class="sticky top-2 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-2.5 shadow-sm dark:border-brand-500/30 dark:bg-gray-900"
        >
          <span class="text-sm font-medium text-brand-600 dark:text-brand-300">Выбрано: {{ selectedBookIds.size }}</span>
          <div class="ml-auto flex flex-wrap items-center gap-2">
            <UiButton size="sm" variant="primary" :start-icon="KeyRound" @click="isBulkAccessModalOpen = true">Выдать доступ</UiButton>
            <UiButton size="sm" variant="danger-ghost" @click="isBulkRevokeModalOpen = true">Снять все доступы</UiButton>
            <UiButton size="sm" variant="ghost" @click="clearSelection">Отменить</UiButton>
          </div>
        </div>
      </Transition>

      <div id="books-table" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
        <div v-if="loading && !books.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <div v-for="i in 6" :key="i" class="flex animate-pulse items-center gap-4 px-4 py-3">
            <div class="h-12 w-9 rounded bg-gray-200 dark:bg-white/[0.06]" />
            <div class="flex-1 space-y-2"><div class="h-3.5 w-1/3 rounded bg-gray-200 dark:bg-white/[0.06]" /><div class="h-3 w-1/5 rounded bg-gray-100 dark:bg-white/[0.04]" /></div>
          </div>
        </div>

        <UiEmptyState
          v-else-if="!books.length"
          :icon="BookOpen"
          title="Книги не найдены"
          :description="hasActiveFilters ? 'Измените условия поиска или сбросьте фильтры' : 'Загрузите первую книгу в библиотеку'"
        >
          <template #actions>
            <UiButton v-if="hasActiveFilters" variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
            <UiButton v-else variant="primary" size="sm" :start-icon="Upload" @click="isUploadModalOpen = true">Загрузить книгу</UiButton>
          </template>
        </UiEmptyState>

        <div v-else class="max-h-[70vh] overflow-auto transition-opacity" :class="{ 'opacity-60': loading }">
          <table class="w-full">
            <thead class="sticky top-0 z-10 bg-white dark:bg-gray-900">
              <tr class="border-b border-gray-200 text-xs font-medium text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <th class="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isSomeSelected"
                    aria-label="Выбрать все"
                    class="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 dark:border-gray-600"
                    @change="toggleSelectAll"
                  />
                </th>
                <th class="px-4 py-3 text-left">Книга</th>
                <th class="hidden px-4 py-3 text-left lg:table-cell">Язык</th>
                <th class="hidden px-4 py-3 text-right md:table-cell">Стр.</th>
                <th class="px-4 py-3 text-left">Статус</th>
                <th class="px-4 py-3 text-left">Доступ</th>
                <th class="hidden px-4 py-3 text-left md:table-cell">Читатели</th>
                <th class="hidden px-4 py-3 text-left xl:table-cell">Последнее чтение</th>
                <th class="px-4 py-3 text-right"><span class="sr-only">Действия</span></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
              <tr
                v-for="book in books"
                :key="book.id"
                class="transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                :class="{ 'bg-brand-50/60 dark:bg-brand-500/10': selectedBookIds.has(book.id) }"
              >
                <td class="px-4 py-3">
                  <input
                    type="checkbox"
                    :checked="selectedBookIds.has(book.id)"
                    :aria-label="`Выбрать «${book.title}»`"
                    class="h-4 w-4 cursor-pointer rounded border-gray-300 text-brand-500 dark:border-gray-600"
                    @change="toggleBookSelection(book.id)"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex max-w-md items-center gap-3">
                    <LibraryBookCover :url="book.cover_url" :title="book.title" :width="72" compact class="w-9 shrink-0" />
                    <div class="min-w-0">
                      <p class="line-clamp-2 text-sm font-semibold text-gray-900 dark:text-white">{{ book.title }}</p>
                      <p class="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {{ book.author || "Автор не указан" }}<template v-if="book.published_year"> · {{ book.published_year }}</template>
                      </p>
                    </div>
                  </div>
                </td>
                <td class="hidden px-4 py-3 lg:table-cell">
                  <span class="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700 dark:bg-white/[0.06] dark:text-gray-200">{{ getLanguageLabel(book.language) }}</span>
                </td>
                <td class="hidden px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300 md:table-cell">{{ book.total_pages || 0 }}</td>
                <td class="px-4 py-3">
                  <UiBadge
                    :color="book.status === 'ready' ? 'success' : book.status === 'processing' ? 'warning' : 'error'"
                    size="sm"
                    :title="book.errorMessage || undefined"
                  >
                    {{ getStatusLabel(book.status) }}
                  </UiBadge>
                </td>
                <td class="px-4 py-3">
                  <button
                    type="button"
                    class="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium transition-colors"
                    :class="book.access_count ? 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]' : 'bg-warning-50 text-warning-700 hover:bg-warning-100 dark:bg-warning-500/15 dark:text-warning-400'"
                    @click="manageAccess(book)"
                  >
                    <KeyRound class="h-3.5 w-3.5" />
                    {{ book.access_count ? `${book.access_count} ${plural(book.access_count, "запись", "записи", "записей")}` : "Не выдан" }}
                  </button>
                </td>
                <td class="hidden px-4 py-3 md:table-cell">
                  <div class="flex items-center gap-2 text-sm">
                    <span class="tabular-nums text-gray-900 dark:text-white">{{ book.readers_count }}</span>
                    <span v-if="book.completed_count" class="text-xs text-success-600" :title="`Дочитали: ${book.completed_count}`">✓ {{ book.completed_count }}</span>
                    <span v-if="book.reading_now" class="inline-flex items-center gap-1 rounded-full bg-success-50 px-1.5 py-0.5 text-[10px] font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400" title="Читают сейчас">
                      <span class="h-1.5 w-1.5 rounded-full bg-success-500" />{{ book.reading_now }}
                    </span>
                  </div>
                </td>
                <td class="hidden whitespace-nowrap px-4 py-3 text-xs text-gray-500 xl:table-cell">
                  {{ book.last_read_at ? formatDate(book.last_read_at) : "—" }}
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-1">
                    <UiButton variant="ghost" size="sm" icon title="Аналитика" aria-label="Аналитика" @click="viewAnalytics(book)">
                      <BarChart3 class="h-4 w-4" />
                    </UiButton>
                    <UiDropdown
                      icon-only
                      variant="ghost"
                      size="sm"
                      aria-label="Действия с книгой"
                      :groups="bookMenuGroups(book)"
                      @select="(key: string) => onBookAction(key, book)"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <UiPagination
          v-if="books.length"
          :current-page="pagination.page"
          :total-pages="Math.ceil(pagination.total / pagination.limit)"
          :total="pagination.total"
          :limit="pagination.limit"
          scroll-target="#books-table"
          @update:page="handlePageChange"
          @update:limit="(l: number) => { pagination.limit = l; pagination.page = 1; fetchBooks(); }"
        />
      </div>
    </template>

    <!-- Модальные окна -->
    <LibraryUploadBookModal :is-open="isUploadModalOpen" @close="isUploadModalOpen = false" @uploaded="handleBookUploaded" />
    <LibraryEditBookModal :is-open="isEditModalOpen" :book="selectedBook" @close="isEditModalOpen = false" @updated="handleBookUpdated" />
    <LibraryAccessModal :is-open="isAccessModalOpen" :book="selectedBook" @close="isAccessModalOpen = false" @changed="fetchBooks" />
    <LibraryAnalyticsModal :is-open="isAnalyticsModalOpen" :book="selectedBook" @close="isAnalyticsModalOpen = false" />

    <UiModal :is-open="isBulkAccessModalOpen" title="Выдать доступ к выбранным книгам" size="md" @close="isBulkAccessModalOpen = false">
      <div class="space-y-5">
        <div class="flex items-center gap-3 rounded-lg border border-brand-200 bg-brand-50/60 p-3 dark:border-brand-500/30 dark:bg-brand-500/10">
          <BookOpen class="h-5 w-5 shrink-0 text-brand-500" />
          <p class="text-sm text-gray-700 dark:text-gray-200">
            Книг выбрано: <span class="font-semibold">{{ selectedBookIds.size }}</span>. Если доступ уже был выдан, срок обновится.
          </p>
        </div>
        <LibraryAccessGrantForm :submitting="bulkGranting" :submit-label="`Выдать доступ к ${selectedBookIds.size} кн.`" @submit="grantBulkAccess" />
      </div>
    </UiModal>

    <UiConfirmModal
      :is-open="isBulkRevokeModalOpen"
      title="Снять все доступы?"
      :message="`У ${selectedBookIds.size} ${plural(selectedBookIds.size, 'книги', 'книг', 'книг')} будут удалены все записи доступа (люди, группы, курсы, роли). Открытые сейчас книги закроются у читателей.`"
      confirm-text="Снять доступы"
      :loading="bulkRevoking"
      @confirm="revokeBulkAccess"
      @cancel="isBulkRevokeModalOpen = false"
    />

    <UiConfirmModal
      :is-open="isDeleteModalOpen"
      title="Удалить книгу?"
      message="Книга исчезнет из каталога, доступы будут сняты, а файл удалён с сервера."
      :item-name="selectedBook?.title"
      warning="История чтения сохранится в аналитике, но восстановить файл будет нельзя."
      :loading="isDeleting"
      @confirm="handleDelete"
      @cancel="isDeleteModalOpen = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "~/composables/useToast";
import {
  Download, Upload, BookOpen, CheckCircle2, Clock, AlertCircle, ShieldAlert, KeyRound, Library,
  BarChart3, Users, Pencil, RefreshCw, Trash2, LayoutList, ChartColumn,
} from "lucide-vue-next";

definePageMeta({ layout: "default" });
useHead({ title: "Управление библиотекой" });

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  language: string;
  cover_url: string | null;
  total_pages: number;
  status: "processing" | "ready" | "failed";
  errorMessage: string | null;
  created_at: string;
  published_year: number | null;
  access_count: number;
  readers_count: number;
  completed_count: number;
  reading_now: number;
  last_read_at: string | null;
}

const toast = useToast();
const route = useRoute();
const router = useRouter();

// ---------- вкладки ----------
const tab = ref<string>(route.query.tab === "analytics" ? "analytics" : "books");
const dashboardRef = ref<{ reload: () => void } | null>(null);
const tabs = computed(() => [
  { id: "books", label: "Книги", icon: LayoutList, count: totalAll.value || null },
  { id: "analytics", label: "Аналитика", icon: ChartColumn },
]);
const onTabChange = (t: string) => {
  router.replace({ query: { ...route.query, tab: t === "books" ? undefined : t } });
  if (t === "books") fetchBooks();
};

// ---------- состояние ----------
const loading = ref(false);
const books = ref<Book[]>([]);
const pagination = ref({ page: 1, limit: 20, total: 0 });
const stats = ref({ ready: 0, processing: 0, failed: 0, withoutAccess: 0 });
const totalAll = computed(() => stats.value.ready + stats.value.processing + stats.value.failed);
const filters = ref({ search: "", status: "", language: "", author: "", access: "" });
const authors = ref<string[]>([]);

const sortOptions = [
  { value: "created_at:desc", label: "Сначала новые" },
  { value: "title:asc", label: "По названию" },
  { value: "readers:desc", label: "Больше читателей" },
  { value: "last_read:desc", label: "Недавно читали" },
  { value: "total_pages:desc", label: "Больше страниц" },
];
const sortKey = ref("created_at:desc");

const languageOptions = [
  { label: "Все языки", value: "" },
  { label: "Русский", value: "ru" },
  { label: "O'zbekcha", value: "uz" },
  { label: "English", value: "en" },
  { label: "Қазақша", value: "kk" },
];
const statusLabels: Record<string, string> = { ready: "Готова", processing: "Обработка", failed: "Ошибка" };

// ---------- модалки ----------
const isUploadModalOpen = ref(false);
const isEditModalOpen = ref(false);
const isAccessModalOpen = ref(false);
const isAnalyticsModalOpen = ref(false);
const isDeleteModalOpen = ref(false);
const isBulkAccessModalOpen = ref(false);
const isBulkRevokeModalOpen = ref(false);
const isDeleting = ref(false);
const bulkGranting = ref(false);
const bulkRevoking = ref(false);
const selectedBook = ref<Book | null>(null);

// ---------- выделение ----------
const selectedBookIds = ref<Set<string>>(new Set());
const isAllSelected = computed(() => books.value.length > 0 && books.value.every((b) => selectedBookIds.value.has(b.id)));
const isSomeSelected = computed(() => selectedBookIds.value.size > 0 && !isAllSelected.value);
const toggleSelectAll = () => {
  selectedBookIds.value = isAllSelected.value ? new Set() : new Set(books.value.map((b) => b.id));
};
const toggleBookSelection = (id: string) => {
  const s = new Set(selectedBookIds.value);
  s.has(id) ? s.delete(id) : s.add(id);
  selectedBookIds.value = s;
};
const clearSelection = () => (selectedBookIds.value = new Set());

// ---------- фильтры ----------
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  const f = filters.value;
  if (f.search) chips.push({ key: "search", label: `Поиск: ${f.search}` });
  if (f.status) chips.push({ key: "status", label: `Статус: ${statusLabels[f.status]}` });
  if (f.access) chips.push({ key: "access", label: "Без доступа" });
  if (f.language) chips.push({ key: "language", label: `Язык: ${languageOptions.find((o) => o.value === f.language)?.label}` });
  if (f.author) chips.push({ key: "author", label: `Автор: ${f.author}` });
  return chips;
});
const hasActiveFilters = computed(() => filterChips.value.length > 0);
const removeFilterChip = (key: string) => {
  (filters.value as Record<string, string>)[key] = "";
  handleFilterChange();
};
const resetFilters = () => {
  filters.value = { search: "", status: "", language: "", author: "", access: "" };
  handleFilterChange();
};
const handleFilterChange = () => {
  pagination.value.page = 1;
  fetchBooks();
};
const selectStatus = (status: string) => {
  filters.value.status = status;
  if (!status) filters.value.access = "";
  handleFilterChange();
};
const toggleWithoutAccess = () => {
  filters.value.access = filters.value.access ? "" : "none";
  handleFilterChange();
};
const showWithoutAccess = () => {
  tab.value = "books";
  onTabChange("books");
  filters.value.access = "none";
  filters.value.status = "";
  handleFilterChange();
};
const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchBooks();
};

// ---------- загрузка ----------
let reqId = 0;
const fetchBooks = async () => {
  const id = ++reqId;
  loading.value = true;
  try {
    const [sortBy = "created_at", sortOrder = "desc"] = sortKey.value.split(":");
    const params: Record<string, string> = {
      page: String(pagination.value.page),
      limit: String(pagination.value.limit),
      sortBy,
      sortOrder,
    };
    for (const [k, v] of Object.entries(filters.value)) if (v) params[k] = v;

    const res = await $fetch<{ books: Book[]; total: number; stats: typeof stats.value }>("/api/library/admin/books", { params });
    if (id !== reqId) return;
    books.value = res.books;
    pagination.value.total = res.total;
    stats.value = res.stats;
  } catch (e: any) {
    if (id === reqId) toast.error(e?.data?.message || "Ошибка загрузки книг");
  } finally {
    if (id === reqId) loading.value = false;
  }
};

const fetchAuthors = async () => {
  try {
    authors.value = (await $fetch<{ authors: string[] }>("/api/library/catalog/authors", { params: { scope: "admin" } })).authors;
  } catch { /* подсказки не критичны */ }
};

// ---------- действия ----------
const exportBooks = () => {
  const params = new URLSearchParams();
  for (const k of ["search", "status", "language", "author"] as const) if (filters.value[k]) params.set(k, filters.value[k]);
  window.open(`/api/library/admin/books/export?${params}`, "_blank");
};

const bookMenuGroups = (book: Book) => [
  {
    items: [
      { key: "read", label: "Открыть книгу", icon: BookOpen, hidden: book.status !== "ready" },
      { key: "access", label: "Управление доступом", icon: Users },
      { key: "edit", label: "Редактировать", icon: Pencil },
      { key: "reprocess", label: "Переобработать", icon: RefreshCw, hidden: book.status === "processing" },
    ],
  },
  { items: [{ key: "delete", label: "Удалить", icon: Trash2, danger: true }] },
];
const onBookAction = (key: string, book: Book) => {
  selectedBook.value = book;
  if (key === "read") router.push(`/library/${book.id}`);
  else if (key === "access") isAccessModalOpen.value = true;
  else if (key === "edit") isEditModalOpen.value = true;
  else if (key === "reprocess") reprocessBook(book);
  else if (key === "delete") isDeleteModalOpen.value = true;
};
const manageAccess = (book: Book) => {
  selectedBook.value = book;
  isAccessModalOpen.value = true;
};
const viewAnalytics = (book: Book) => {
  selectedBook.value = book;
  isAnalyticsModalOpen.value = true;
};
const openAnalyticsById = (id: string) => {
  const known = books.value.find((b) => b.id === id);
  selectedBook.value = known || ({ id, title: "Книга", author: null, cover_url: `/api/library/covers/${id}` } as Book);
  isAnalyticsModalOpen.value = true;
};

const handleBookUploaded = () => {
  isUploadModalOpen.value = false;
  fetchBooks();
  toast.success("Книга загружена. Не забудьте выдать к ней доступ.");
};
const handleBookUpdated = () => {
  isEditModalOpen.value = false;
  fetchBooks();
};

const reprocessBook = async (book: Book) => {
  try {
    await $fetch(`/api/library/admin/books/${book.id}/reprocess`, { method: "POST" });
    toast.success("Книга отправлена на повторную обработку");
    fetchBooks();
  } catch (e: any) {
    toast.error(e?.data?.message || "Ошибка переобработки книги");
  }
};

const handleDelete = async () => {
  if (!selectedBook.value) return;
  isDeleting.value = true;
  try {
    await $fetch(`/api/library/admin/books/${selectedBook.value.id}`, { method: "DELETE" as any });
    toast.success("Книга удалена");
    isDeleteModalOpen.value = false;
    fetchBooks();
  } catch (e: any) {
    toast.error(e?.data?.message || "Ошибка удаления книги");
  } finally {
    isDeleting.value = false;
  }
};

const grantBulkAccess = async (payload: { type: string; targetId: string; expiresAt: string | null }) => {
  bulkGranting.value = true;
  try {
    const res: any = await $fetch("/api/library/admin/books/bulk-access", {
      method: "POST",
      body: { ...payload, bookIds: Array.from(selectedBookIds.value) },
    });
    toast.success(res.message || "Доступ выдан");
    isBulkAccessModalOpen.value = false;
    clearSelection();
    fetchBooks();
  } catch (e: any) {
    toast.error(e?.data?.message || "Ошибка массовой выдачи доступа");
  } finally {
    bulkGranting.value = false;
  }
};

const revokeBulkAccess = async () => {
  bulkRevoking.value = true;
  try {
    const res: any = await $fetch("/api/library/admin/books/bulk-revoke", {
      method: "DELETE",
      body: { bookIds: Array.from(selectedBookIds.value) },
    });
    toast.success(res.message || "Доступы сняты");
    isBulkRevokeModalOpen.value = false;
    clearSelection();
    fetchBooks();
  } catch (e: any) {
    toast.error(e?.data?.message || "Ошибка снятия доступов");
  } finally {
    bulkRevoking.value = false;
  }
};

// ---------- форматирование ----------
const getStatusLabel = (s: string) => statusLabels[s] || s;
const getLanguageLabel = (l: string | null) => (l ? l.toUpperCase() : "—");
const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

onMounted(() => {
  fetchBooks();
  fetchAuthors();
});
</script>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.2s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>
