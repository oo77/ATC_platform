<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Header Section -->
    <div class="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
      <div class="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-4xl font-black text-slate-900 dark:text-white tracking-tight uppercase">
            Библиотека
          </h2>
          <p class="text-sm font-bold text-slate-500 mt-2">
            Доступные вам материалы для чтения и изучения
          </p>
        </div>
        <div v-if="isStaff" class="flex flex-wrap items-center gap-2">
          <NuxtLink to="/admin/library/books">
            <UiButton variant="primary" class="h-11 px-6 gap-2 font-bold shadow-sm rounded-xl">
              <Library class="w-5 h-5 text-white" />
              <span>Панель управления</span>
            </UiButton>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Stats Row (Bento style) -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-75">
      <div class="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-primary/30 transition-colors group">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 group-hover:scale-110 transition-transform">
            <Library class="w-7 h-7" />
          </div>
          <div>
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest">Доступно книг</h3>
            <p class="text-3xl font-black text-slate-900 dark:text-white mt-0.5">{{ pagination.total }}</p>
          </div>
        </div>
      </div>

      <div class="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-success/30 transition-colors group text-left">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 group-hover:scale-110 transition-transform">
            <BookCheck class="w-7 h-7" />
          </div>
          <div class="min-w-0">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest truncate">Ваш прогресс</h3>
            <p class="text-3xl font-black text-slate-900 dark:text-white mt-0.5">В процессе</p>
          </div>
        </div>
      </div>

      <div class="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-sm hover:border-amber/30 transition-colors group text-left">
        <div class="flex items-center gap-4">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 group-hover:scale-110 transition-transform">
            <Clock class="w-7 h-7" />
          </div>
          <div class="min-w-0">
            <h3 class="text-xs font-black text-slate-400 uppercase tracking-widest truncate">Последняя активность</h3>
            <p class="text-lg font-black text-slate-900 dark:text-white mt-0.5 truncate">Сегодня</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Умный Фильтр (Bento style) -->
    <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 sm:p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-700 delay-100">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Поиск -->
        <div class="relative group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по названию..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all cursor-text h-[52px]"
            @input="handleSearch"
          />
          <Search class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
        </div>

        <!-- Фильтр по автору (Custom Dropdown) -->
        <div class="relative group">
          <input
            v-model="authorQuery"
            type="text"
            placeholder="Автор произведения..."
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-10 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all cursor-text h-[52px]"
            @focus="showAuthorDropdown = true"
            @blur="hideAuthorDropdown"
            @input="handleSearch"
          />
          <User class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
          <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform duration-300" :class="showAuthorDropdown ? 'rotate-180 text-primary' : ''" />
          
          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="showAuthorDropdown && filteredAuthors.length" class="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
              <div 
                v-for="author in filteredAuthors" 
                :key="author"
                @mousedown.prevent="selectAuthor(author)"
                class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                :class="authorQuery === author ? 'bg-primary/5 text-primary dark:text-primary' : ''"
              >
                {{ author }}
              </div>
            </div>
          </transition>
        </div>

        <!-- Язык (Custom Dropdown) -->
        <div class="relative group">
          <input
            :value="selectedLanguageLabel"
            type="text"
            readonly
            placeholder="Все языки"
            class="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-10 text-sm font-bold text-slate-900 outline-none focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-primary transition-all cursor-pointer h-[52px]"
            @focus="showLanguageDropdown = true"
            @blur="hideLanguageDropdown"
          />
          <Globe class="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors pointer-events-none" />
          <ChevronDown class="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none transition-transform duration-300" :class="showLanguageDropdown ? 'rotate-180 text-primary' : ''" />

          <transition
            enter-active-class="transition ease-out duration-200"
            enter-from-class="opacity-0 translate-y-1"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition ease-in duration-150"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-1"
          >
            <div v-if="showLanguageDropdown" class="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-60 overflow-y-auto custom-scrollbar">
              <div 
                v-for="lang in languageOptions" 
                :key="lang.value"
                @mousedown.prevent="selectLanguage(lang.value)"
                class="px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer text-sm font-bold transition-colors"
                :class="selectedLanguage === lang.value ? 'bg-primary/5 text-primary dark:text-primary' : 'text-slate-700 dark:text-slate-300'"
              >
                {{ lang.label }}
              </div>
            </div>
          </transition>
        </div>
      </div>
    </div>

    <!-- Загрузка -->
    <div v-if="loading" class="flex justify-center items-center py-32">
      <div class="text-center">
        <div class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
        <p class="mt-4 text-slate-500 font-bold">Загрузка каталога...</p>
      </div>
    </div>

    <!-- Пустое состояние -->
    <div
      v-else-if="books.length === 0"
      class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-16 text-center animate-in fade-in duration-500"
    >
      <div class="bg-slate-50 dark:bg-slate-800/50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
        <BookX class="w-12 h-12 text-slate-300 dark:text-slate-600" />
      </div>
      <h3 class="text-2xl font-black text-slate-900 dark:text-white mb-3">
        Ничего не найдено
      </h3>
      <p class="text-slate-500 font-medium max-w-md mx-auto">
        {{
          searchQuery || selectedLanguage || authorQuery
            ? "Попробуйте изменить параметры поиска, чтобы найти нужную книгу"
            : "У вас пока нет доступа к книгам в библиотеке"
        }}
      </p>
      <UiButton v-if="searchQuery || selectedLanguage || authorQuery" @click="resetFilters" variant="outline" class="mt-6 border-slate-200">
        Сбросить фильтры
      </UiButton>
    </div>

    <!-- Список книг -->
    <div v-else class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <!-- Header -->
      <div class="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-black text-slate-400 uppercase tracking-widest">
        <div class="col-span-5">Название</div>
        <div class="col-span-2">Автор</div>
        <div class="col-span-2 text-center">Язык</div>
        <div class="col-span-1 text-center">Год</div>
        <div class="col-span-2 text-right">Прогресс</div>
      </div>

      <!-- Book Rows -->
      <div
        v-for="book in books"
        :key="book.id"
        @click="openBook(book)"
        class="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        <!-- Book Info -->
        <div class="col-span-5 flex items-center gap-4">
          <div class="h-12 w-12 shrink-0 rounded-xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <BookOpen class="w-6 h-6" />
          </div>
          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <h4 class="text-base font-bold text-slate-900 dark:text-white leading-tight truncate group-hover:text-primary transition-colors">
                {{ book.title }}
              </h4>
              <!-- Continue Reading Badge -->
              <span 
                v-if="book.progress && book.progress.current_page > 0"
                class="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider"
              >
                <BookCheck class="w-3 h-3" />
                Продолжить
              </span>
            </div>
            <p class="text-sm text-slate-500 mt-1 truncate md:hidden">
              {{ book.author || "Автор не указан" }}
            </p>
          </div>
        </div>

        <!-- Author -->
        <div class="col-span-2 hidden md:flex items-center">
          <span class="text-sm font-medium text-slate-600 dark:text-slate-400 truncate">
            {{ book.author || "Автор не указан" }}
          </span>
        </div>

        <!-- Language -->
        <div class="col-span-2 hidden md:flex items-center justify-center">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-400">
            <Globe class="w-3.5 h-3.5" />
            {{ getLanguageLabel(book.language) }}
          </span>
        </div>

        <!-- Year -->
        <div class="col-span-1 hidden md:flex items-center justify-center">
          <span class="text-sm font-medium text-slate-500">
            {{ book.published_year || "—" }}
          </span>
        </div>

        <!-- Progress -->
        <div class="col-span-2 hidden md:flex items-center justify-end">
          <div v-if="book.progress && book.progress.current_page > 0" class="flex items-center gap-3">
            <div class="w-24 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary rounded-full transition-all duration-700 delay-100 ease-out" 
                :style="{ width: `${book.progress.percentage}%` }"
              ></div>
            </div>
            <span class="text-xs font-bold text-slate-500 tabular-nums">
              {{ book.progress.percentage }}%
            </span>
          </div>
          <div v-else class="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Clock class="w-3.5 h-3.5" />
            Не начата
          </div>
        </div>

        <!-- Mobile Progress -->
        <div class="col-span-1 md:hidden flex items-center justify-end">
          <div v-if="book.progress && book.progress.current_page > 0" class="flex items-center gap-2">
            <div class="w-16 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                class="h-full bg-primary rounded-full" 
                :style="{ width: `${book.progress.percentage}%` }"
              ></div>
            </div>
            <span class="text-xs font-bold text-primary">
              {{ book.progress.percentage }}%
            </span>
          </div>
          <span v-else class="text-xs text-slate-400">—</span>
        </div>
      </div>
    </div>

    <!-- Пагинация -->
    <div v-if="pagination.total > pagination.limit" class="mt-10 flex justify-center animate-in fade-in duration-700 delay-300">
      <UiPagination
        :current-page="pagination.page"
        :total-pages="Math.ceil(pagination.total / pagination.limit)"
        :total="pagination.total"
        :limit="pagination.limit"
        @update:page="handlePageChange"
        @update:limit="(l: number) => { pagination.limit = l; fetchBooks(); }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
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
  ArrowUpRight,
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
const isSelectingLanguage = ref(false);

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

const selectLanguage = (val: string) => {
  selectedLanguage.value = val;
  isSelectingLanguage.value = true;
  showLanguageDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks().finally(() => {
    isSelectingLanguage.value = false;
  });
};

const hideAuthorDropdown = () => {
  setTimeout(() => { showAuthorDropdown.value = false; }, 200);
};

const hideLanguageDropdown = () => {
  if (!isSelectingLanguage.value) {
    showLanguageDropdown.value = false;
  }
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
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 10px;
}
:global(.dark) .custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: #475569;
}
</style>