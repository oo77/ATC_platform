<template>
  <!-- Внешний враппер без двойного отступа: отступы даёт layout -->
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <!-- Единый заголовок; главное действие для персонала — «Панель управления» -->
    <UiPageHeader title="Библиотека" description="Доступные вам материалы для чтения и изучения">
      <template #actions>
        <UiButton v-if="isStaff" to="/admin/library/books" variant="primary" :start-icon="Library">
          Панель управления
        </UiButton>
      </template>
    </UiPageHeader>

    <!-- Три декоративные карточки («В процессе», «Сегодня» — заглушки без данных) убраны: количество книг показывает «Найдено N» в блоке фильтров -->

    <!-- Единый блок фильтров: поиск на виду, автор и язык — в панели «Фильтры»; «Сбросить всё» доступно, как только что-то применено -->
    <UiFilterBar
      v-model:search="searchQuery"
      search-placeholder="Поиск по названию…"
      :debounce="0"
      :chips="filterChips"
      :active-count="filterChips.length"
      :total="pagination.total"
      persist-key="library"
      @search="handleSearch"
      @remove="removeFilterChip"
      @reset="resetFilters"
    >
      <template #filters>
        <!-- Автор: поле с подсказками (класс group нужен closeDropdowns для закрытия по клику вне) -->
        <div class="group relative">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Автор</span>
          <div class="relative">
            <User class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              v-model="authorQuery"
              type="text"
              placeholder="Автор произведения…"
              class="h-9 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-14 text-sm text-gray-800 placeholder:text-gray-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-gray-100"
              @focus="showAuthorDropdown = true"
              @input="showAuthorDropdown = true"
            />
            <button
              v-if="authorQuery"
              type="button"
              aria-label="Очистить автора"
              class="absolute right-8 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              @click.stop="clearAuthor"
            >
              <X class="h-3.5 w-3.5" />
            </button>
            <ChevronDown
              class="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition-transform duration-200"
              :class="showAuthorDropdown ? 'rotate-180 text-primary' : ''"
            />
          </div>

          <!-- Список подсказок авторов -->
          <div
            v-if="showAuthorDropdown && filteredAuthors.length"
            class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <div
              v-for="author in filteredAuthors"
              :key="author"
              class="cursor-pointer rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/[0.06]"
              :class="authorQuery === author ? 'bg-primary-50 text-primary dark:bg-primary-500/15' : ''"
              @click="selectAuthor(author)"
            >
              {{ author }}
            </div>
          </div>
        </div>

        <!-- Язык: обычный select вместо самописного выпадающего списка (меньше кода, работает с клавиатурой) -->
        <label class="block">
          <span class="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Язык</span>
          <select
            :value="selectedLanguage"
            class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            @change="(e) => selectLanguage((e.target as HTMLSelectElement).value)"
          >
            <option v-for="lang in languageOptions" :key="lang.value" :value="lang.value">{{ lang.label }}</option>
          </select>
        </label>
      </template>
    </UiFilterBar>

    <!-- Загрузка -->
    <div v-if="loading" class="rounded-xl border border-gray-200 bg-white py-24 text-center dark:border-gray-800 dark:bg-white/[0.03]">
      <div class="inline-block h-10 w-10 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
      <p class="mt-4 text-sm text-gray-500">Загрузка каталога...</p>
    </div>

    <!-- Пусто: причина + следующий шаг (сброс фильтров) -->
    <div v-else-if="books.length === 0" class="rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <UiEmptyState
        :icon="BookX"
        title="Ничего не найдено"
        :description="searchQuery || selectedLanguage || authorQuery
          ? 'Попробуйте изменить параметры поиска, чтобы найти нужную книгу'
          : 'У вас пока нет доступа к книгам в библиотеке'"
      >
        <template v-if="searchQuery || selectedLanguage || authorQuery" #actions>
          <UiButton variant="outline" size="sm" @click="resetFilters">Сбросить фильтры</UiButton>
        </template>
      </UiEmptyState>
    </div>

    <!-- Список книг: карточка, пагинация — футер внутри -->
    <div v-else id="library-list" class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <!-- Шапка колонок (только на десктопе) -->
      <div class="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-white px-4 py-3 text-xs font-medium text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 md:grid">
        <div class="col-span-5">Название</div>
        <div class="col-span-2">Автор</div>
        <div class="col-span-2 text-center">Язык</div>
        <div class="col-span-1 text-center">Год</div>
        <div class="col-span-2 text-right">Прогресс</div>
      </div>

      <!-- Строки книг: кликабельны целиком -->
      <div
        v-for="book in books"
        :key="book.id"
        class="group grid cursor-pointer grid-cols-1 gap-4 border-b border-gray-100 px-4 py-3 transition-colors last:border-b-0 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03] md:grid-cols-12"
        @click="openBook(book)"
      >
        <!-- Название + бейдж «Продолжить» -->
        <div class="col-span-5 flex items-center gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary transition-colors group-hover:bg-primary group-hover:text-white dark:bg-primary-500/15">
            <BookOpen class="h-5 w-5" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="truncate text-sm font-semibold leading-tight text-gray-900 transition-colors group-hover:text-primary dark:text-white">
                {{ book.title }}
              </h4>
              <UiBadge v-if="book.progress && book.progress.current_page > 0" size="sm" color="primary" class="shrink-0">Продолжить</UiBadge>
            </div>
            <p class="mt-0.5 truncate text-xs text-gray-500 md:hidden">
              {{ book.author || "Автор не указан" }}
            </p>
          </div>
        </div>

        <!-- Автор -->
        <div class="col-span-2 hidden items-center md:flex">
          <span class="truncate text-sm text-gray-600 dark:text-gray-400">
            {{ book.author || "Автор не указан" }}
          </span>
        </div>

        <!-- Язык -->
        <div class="col-span-2 hidden items-center justify-center md:flex">
          <span class="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-gray-400">
            <Globe class="h-3.5 w-3.5" />
            {{ getLanguageLabel(book.language) }}
          </span>
        </div>

        <!-- Год -->
        <div class="col-span-1 hidden items-center justify-center md:flex">
          <span class="text-sm text-gray-500">
            {{ book.published_year || "—" }}
          </span>
        </div>

        <!-- Прогресс (десктоп) -->
        <div class="col-span-2 hidden items-center justify-end md:flex">
          <div v-if="book.progress && book.progress.current_page > 0" class="flex items-center gap-3">
            <div class="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                class="h-full rounded-full bg-primary transition-all duration-500 ease-out"
                :style="{ width: `${book.progress.percentage}%` }"
              ></div>
            </div>
            <span class="text-xs tabular-nums text-gray-500">
              {{ book.progress.percentage }}%
            </span>
          </div>
          <div v-else class="flex items-center gap-2 text-xs text-gray-400">
            <Clock class="h-3.5 w-3.5" />
            Не начата
          </div>
        </div>

        <!-- Прогресс (мобильный) -->
        <div class="col-span-1 flex items-center justify-end md:hidden">
          <div v-if="book.progress && book.progress.current_page > 0" class="flex items-center gap-2">
            <div class="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
              <div
                class="h-full rounded-full bg-primary"
                :style="{ width: `${book.progress.percentage}%` }"
              ></div>
            </div>
            <span class="text-xs text-primary">
              {{ book.progress.percentage }}%
            </span>
          </div>
          <span v-else class="text-xs text-gray-400">—</span>
        </div>
      </div>

      <!-- Единая пагинация внутри карточки (раньше была снаружи по центру) -->
      <UiPagination
        :current-page="pagination.page"
        :total-pages="Math.ceil(pagination.total / pagination.limit)"
        :total="pagination.total"
        :limit="pagination.limit"
        :limit-options="[12, 24, 48]"
        @update:page="handlePageChange"
        @update:limit="(l: number) => { pagination.limit = l; pagination.page = 1; fetchBooks(); }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import { 
  Library, 
  Search, 
  User, 
  Globe, 
  ChevronDown, 
  BookOpen, 
  BookX, 
  Clock, 
  X,
  BookCheck
} from "lucide-vue-next";
import { useToast } from "~/composables/useToast";
import { usePermissions } from "~/composables/usePermissions";

const { isStaff } = usePermissions();

definePageMeta({ layout: "default" as any });

interface Book {
  id: string;
  title: string;
  author: string | null;
  description: string | null;
  language: string | null;
  cover_url: string | null;
  published_year: number | null;
  total_pages: number;
  progress?: {
    current_page: number;
    total_pages: number;
    percentage: number;
    lastReadAt: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
}

const languageOptions = [
  { value: "", label: "Все языки" },
  { value: "ru", label: "🇷🇺 Русский" },
  { value: "uz", label: "🇺🇿 O'zbekcha" },
  { value: "en", label: "🇬🇧 English" },
  { value: "kk", label: "🇰🇿 Қазақша" }
];

const router = useRouter();
const toast = useToast();

const loading = ref(false);
const books = ref<Book[]>([]);
const searchQuery = ref("");
const selectedLanguage = ref("");
const authorQuery = ref("");
const authors = ref<string[]>([]);

const showAuthorDropdown = ref(false);
const showLanguageDropdown = ref(false);

const pagination = ref<Pagination>({
  page: 1,
  limit: 12,
  total: 0,
});

const filteredAuthors = computed(() => {
  if (!authorQuery.value) return authors.value;
  const q = authorQuery.value.toLowerCase();
  return authors.value.filter(a => a.toLowerCase().includes(q));
});

const selectedLanguageLabel = computed(() => {
  const opt = languageOptions.find(o => o.value === selectedLanguage.value);
  return opt ? opt.label : "Все языки";
});

// Чипы применённых фильтров: поиск, автор, язык — состояние видно и снимается по одному
const filterChips = computed(() => {
  const chips: { key: string; label: string }[] = [];
  if (searchQuery.value) chips.push({ key: "search", label: `Поиск: ${searchQuery.value}` });
  if (authorQuery.value) chips.push({ key: "author", label: `Автор: ${authorQuery.value}` });
  if (selectedLanguage.value) chips.push({ key: "language", label: `Язык: ${selectedLanguageLabel.value}` });
  return chips;
});
// Снятие чипа вызывает прежние обработчики очистки
const removeFilterChip = (key: string) => {
  if (key === "author") return clearAuthor();
  if (key === "language") return clearLanguage();
  searchQuery.value = "";
  pagination.value.page = 1;
  fetchBooks();
};

const fetchAuthors = async () => {
  try {
    const res = await $fetch<{ authors: string[] }>("/api/library/catalog/authors");
    authors.value = res.authors;
  } catch (error) {
    console.warn("Failed to fetch authors", error);
  }
};

const fetchBooks = async () => {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      page: pagination.value.page.toString(),
      limit: pagination.value.limit.toString(),
      ...(searchQuery.value && { search: searchQuery.value }),
      ...(selectedLanguage.value && { language: selectedLanguage.value }),
      ...(authorQuery.value && { author: authorQuery.value })
    });

    const response = await $fetch<{ books: Book[]; total: number }>(`/api/library/catalog?${params}`);
    books.value = response.books;
    pagination.value.total = response.total;
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка загрузки каталога");
  } finally {
    loading.value = false;
  }
};

const selectAuthor = (author: string) => {
  authorQuery.value = author;
  showAuthorDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks();
};

const clearAuthor = () => {
  authorQuery.value = "";
  showAuthorDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks();
};

const selectLanguage = (val: string) => {
  selectedLanguage.value = val;
  showLanguageDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks();
};

const clearLanguage = () => {
  selectedLanguage.value = "";
  showLanguageDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks();
};

const resetFilters = () => {
  searchQuery.value = "";
  selectedLanguage.value = "";
  authorQuery.value = "";
  pagination.value.page = 1;
  fetchBooks();
};

let searchTimeout: NodeJS.Timeout;
const handleSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    pagination.value.page = 1;
    fetchBooks();
  }, 300);
};

const handlePageChange = (page: number) => {
  pagination.value.page = page;
  fetchBooks();
  window.scrollTo({ top: 0, behavior: "smooth" });
};

const openBook = (book: Book) => {
  router.push(`/library/${book.id}`);
};

const getLanguageLabel = (lang: string | null) => {
  if (!lang) return "—";
  const labels: Record<string, string> = { ru: "RU", uz: "UZ", en: "EN", kk: "KK" };
  return labels[lang] || lang.toUpperCase();
};

onMounted(() => {
  fetchBooks();
  fetchAuthors();
  document.addEventListener('click', closeDropdowns);
});

onUnmounted(() => {
  document.removeEventListener('click', closeDropdowns);
});

const closeDropdowns = (e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (!target.closest('.group')) {
    showAuthorDropdown.value = false;
    showLanguageDropdown.value = false;
  }
};
</script>
