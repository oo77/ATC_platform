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

    <!-- Сетка книг (Bento Grid) -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
      <div
        v-for="book in books"
        :key="book.id"
        @click="openBook(book)"
        class="group relative flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 cursor-pointer hover:border-primary/50 hover:shadow-xl dark:hover:bg-slate-800/80 transition-all duration-300 overflow-hidden"
      >
        <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity -translate-y-2 group-hover:translate-y-0 duration-300">
          <div class="bg-primary/10 text-primary p-2.5 rounded-xl">
            <ArrowUpRight class="w-5 h-5" />
          </div>
        </div>

        <div class="flex items-start gap-5 mb-5">
          <div class="h-16 w-16 shrink-0 rounded-2xl bg-linear-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center text-primary group-hover:from-primary group-hover:to-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
            <BookOpen class="w-8 h-8" />
          </div>
          <div class="flex-1 min-w-0 pt-1">
            <h4 class="text-lg font-bold text-slate-900 dark:text-white leading-tight line-clamp-2 group-hover:text-primary transition-colors pr-8">
              {{ book.title }}
            </h4>
            <p class="text-sm font-medium text-slate-500 mt-2 truncate flex items-center gap-1.5">
              <User class="w-3.5 h-3.5 opacity-70" />
              {{ book.author || "Автор не указан" }}
            </p>
          </div>
        </div>
        
        <div class="flex-1"></div>

        <div class="grid grid-cols-2 gap-3 mb-5">
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Calendar class="w-3 h-3" /> Год</span>
            <span class="text-sm font-bold text-slate-900 dark:text-white">{{ book.published_year || '—' }}</span>
          </div>
          
          <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-3 flex flex-col justify-center border border-slate-100 dark:border-slate-800">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Languages class="w-3 h-3" /> Язык</span>
            <span class="text-sm font-bold text-slate-900 dark:text-white">{{ getLanguageLabel(book.language) }}</span>
          </div>
        </div>
        
        <!-- Progress Bar (Bento style) -->
        <div class="pt-5 border-t border-slate-100 dark:border-slate-800">
          <div v-if="book.progress && book.progress.current_page > 0">
            <div class="flex items-center justify-between text-xs mb-2.5">
              <span class="font-black text-primary uppercase tracking-wider">{{ book.progress.percentage }}% прочитано</span>
              <span class="text-slate-500 font-bold border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-md">
                {{ book.progress.current_page }} <span class="text-slate-300 dark:text-slate-600">/</span> {{ book.total_pages }} стр.
              </span>
            </div>
            <div class="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div class="h-full bg-primary rounded-full transition-all duration-700 delay-100 ease-out" :style="{ width: `${book.progress.percentage}%` }"></div>
            </div>
          </div>
          <div v-else class="flex items-center justify-between text-xs font-black text-slate-400 uppercase tracking-widest py-1">
            <span class="flex items-center gap-1.5"><Clock class="w-3.5 h-3.5" /> Еще не начата</span>
            <span class="text-slate-900 dark:text-white opacity-40">{{ book.total_pages }} стр.</span>
          </div>
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
  Calendar, 
  Languages, 
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

// Состояние
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

// Computed
const filteredAuthors = computed(() => {
  if (!authorQuery.value) return authors.value;
  const q = authorQuery.value.toLowerCase();
  return authors.value.filter(a => a.toLowerCase().includes(q));
});

const selectedLanguageLabel = computed(() => {
  const opt = languageOptions.find(o => o.value === selectedLanguage.value);
  return opt ? opt.label : "Все языки";
});

// Методы
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
  showLanguageDropdown.value = false;
  pagination.value.page = 1;
  fetchBooks();
};

const hideAuthorDropdown = () => {
  setTimeout(() => { showAuthorDropdown.value = false; }, 200);
};

const hideLanguageDropdown = () => {
  setTimeout(() => { showLanguageDropdown.value = false; }, 200);
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
  const labels: Record<string, string> = { ru: "🇷🇺 RU", uz: "🇺🇿 UZ", en: "🇬🇧 EN", kk: "🇰🇿 KK" };
  return labels[lang] || lang.toUpperCase();
};

// Lifecycle
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
