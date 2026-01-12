<template>
  <div class="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4 border-t border-stroke dark:border-strokedark">
    <!-- Информация о записях -->
    <div class="text-sm text-gray-600 dark:text-gray-400">
      Показано <span class="font-medium text-black dark:text-white">{{ from }}</span>
      — <span class="font-medium text-black dark:text-white">{{ to }}</span>
      из <span class="font-medium text-black dark:text-white">{{ total }}</span> записей
    </div>

    <!-- Навигация по страницам -->
    <div class="flex items-center gap-2">
      <!-- Кнопка "Первая страница" -->
      <button
        :disabled="currentPage === 1 || loading"
        @click="goToPage(1)"
        class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4',
        ]"
        title="Первая страница"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      <!-- Кнопка "Предыдущая страница" -->
      <button
        :disabled="currentPage === 1 || loading"
        @click="goToPage(currentPage - 1)"
        class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          currentPage === 1
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4',
        ]"
        title="Предыдущая страница"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <!-- Номера страниц -->
      <div class="flex items-center gap-1">
        <template v-for="page in visiblePages" :key="page">
          <button
            v-if="page !== '...'"
            :disabled="loading"
            @click="goToPage(page as number)"
            class="min-w-[40px] h-10 px-3 rounded-lg text-sm font-medium transition-all duration-200"
            :class="[
              currentPage === page
                ? 'bg-primary text-white shadow-md'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4',
            ]"
          >
            {{ page }}
          </button>
          <span
            v-else
            class="min-w-[40px] h-10 px-3 flex items-center justify-center text-gray-400 dark:text-gray-600"
          >
            ⋯
          </span>
        </template>
      </div>

      <!-- Кнопка "Следующая страница" -->
      <button
        :disabled="currentPage === totalPages || loading"
        @click="goToPage(currentPage + 1)"
        class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4',
        ]"
        title="Следующая страница"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <!-- Кнопка "Последняя страница" -->
      <button
        :disabled="currentPage === totalPages || loading"
        @click="goToPage(totalPages)"
        class="p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        :class="[
          currentPage === totalPages
            ? 'text-gray-400 dark:text-gray-600'
            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-meta-4',
        ]"
        title="Последняя страница"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- Выбор количества записей на странице -->
    <div class="flex items-center gap-2">
      <label class="text-sm text-gray-600 dark:text-gray-400">
        На странице:
      </label>
      <select
        :value="limit"
        :disabled="loading"
        @change="handleLimitChange"
        class="rounded-lg border border-stroke bg-transparent py-2 px-3 text-sm outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:focus:border-primary"
      >
        <option v-for="option in limitOptions" :key="option" :value="option">
          {{ option }}
        </option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  currentPage: number;
  totalPages: number;
  total: number;
  limit: number;
  loading?: boolean;
  limitOptions?: number[];
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  limitOptions: () => [10, 25, 50, 100],
});

const emit = defineEmits<{
  'update:page': [page: number];
  'update:limit': [limit: number];
}>();

// Начальная и конечная запись на текущей странице
const from = computed(() => {
  if (props.total === 0) return 0;
  return (props.currentPage - 1) * props.limit + 1;
});

const to = computed(() => {
  return Math.min(props.currentPage * props.limit, props.total);
});

// Вычисление видимых страниц
const visiblePages = computed(() => {
  const pages: (number | string)[] = [];
  const total = props.totalPages;
  const current = props.currentPage;
  const delta = 2; // Количество страниц до и после текущей

  if (total <= 7) {
    // Показываем все страницы если их мало
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Всегда показываем первую страницу
    pages.push(1);

    if (current > delta + 2) {
      pages.push('...');
    }

    // Страницы вокруг текущей
    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
      pages.push(i);
    }

    if (current < total - delta - 1) {
      pages.push('...');
    }

    // Всегда показываем последнюю страницу
    pages.push(total);
  }

  return pages;
});

const goToPage = (page: number) => {
  if (page >= 1 && page <= props.totalPages && page !== props.currentPage) {
    emit('update:page', page);
  }
};

const handleLimitChange = (event: Event) => {
  const target = event.target as HTMLSelectElement;
  const newLimit = parseInt(target.value, 10);
  emit('update:limit', newLimit);
};
</script>
