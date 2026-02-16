<template>
  <UiModal
    :is-open="isOpen"
    title="Аналитика книги"
    size="xl"
    @close="$emit('close')"
  >
    <div v-if="book" class="space-y-6">
      <!-- Информация о книге -->
      <div
        class="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
      >
        <div
          class="h-16 w-12 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0"
        >
          <img
            v-if="book.cover_url"
            :src="book.cover_url"
            :alt="book.title"
            class="h-full w-full object-cover"
          />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900 dark:text-white">
            {{ book.title }}
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ book.author || "Автор не указан" }}
          </p>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="text-center py-12">
        <div
          class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"
        ></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">
          Загрузка аналитики...
        </p>
      </div>

      <!-- Статистика -->
      <div v-else-if="analytics">
        <!-- Общая статистика -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 bg-primary/10 rounded-lg">
            <div class="flex items-center gap-3">
              <svg
                class="w-8 h-8 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего просмотров
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics.totalViews }}
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 bg-success/10 rounded-lg">
            <div class="flex items-center gap-3">
              <svg
                class="w-8 h-8 text-success"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Уникальных читателей
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics.uniqueReaders }}
                </p>
              </div>
            </div>
          </div>

          <div class="p-4 bg-warning/10 rounded-lg">
            <div class="flex items-center gap-3">
              <svg
                class="w-8 h-8 text-warning"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Завершили чтение
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ analytics.completedReaders }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Средний прогресс -->
        <div
          class="p-4 bg-white dark:bg-boxdark border border-gray-200 dark:border-gray-700 rounded-lg"
        >
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Средний прогресс чтения
          </h4>
          <div class="flex items-center gap-4">
            <div class="flex-1">
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  class="bg-primary rounded-full h-3 transition-all duration-300"
                  :style="{ width: `${analytics.averageProgress}%` }"
                ></div>
              </div>
            </div>
            <span class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ analytics.averageProgress }}%
            </span>
          </div>
        </div>

        <!-- Активные читатели -->
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
            Активные читатели
          </h4>

          <div
            v-if="analytics.activeReaders.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <p>Нет активных читателей</p>
          </div>

          <div v-else class="space-y-2">
            <div
              v-for="reader in analytics.activeReaders"
              :key="reader.userId"
              class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div class="flex items-center gap-3">
                <div
                  class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center"
                >
                  <span class="text-sm font-semibold text-primary">
                    {{ getInitials(reader.userName) }}
                  </span>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ reader.userName }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Последняя активность: {{ formatDate(reader.lastActivity) }}
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  Стр. {{ reader.currentPage }} / {{ book.total_pages }}
                </p>
                <div class="flex items-center gap-2 mt-1">
                  <div
                    class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5"
                  >
                    <div
                      class="bg-primary rounded-full h-1.5"
                      :style="{ width: `${reader.progress}%` }"
                    ></div>
                  </div>
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    {{ reader.progress }}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- История сессий -->
        <div>
          <h4 class="font-semibold text-gray-900 dark:text-white mb-4">
            Последние сессии чтения
          </h4>

          <div
            v-if="analytics.recentSessions.length === 0"
            class="text-center py-8 text-gray-500 dark:text-gray-400"
          >
            <p>Нет записей о сессиях</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-700">
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Читатель
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Начало
                  </th>
                  <th
                    class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Окончание
                  </th>
                  <th
                    class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Длительность
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr
                  v-for="session in analytics.recentSessions"
                  :key="session.id"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                    {{ session.userName }}
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {{ formatDateTime(session.startedAt) }}
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400"
                  >
                    {{
                      session.endedAt
                        ? formatDateTime(session.endedAt)
                        : "В процессе"
                    }}
                  </td>
                  <td
                    class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 text-right"
                  >
                    {{ formatDuration(session.duration) }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useToast } from "~/composables/useToast";

interface Book {
  id: string;
  title: string;
  author: string | null;
  cover_url: string | null;
  total_pages: number;
}

interface Analytics {
  totalViews: number;
  uniqueReaders: number;
  completedReaders: number;
  averageProgress: number;
  activeReaders: Array<{
    userId: number;
    userName: string;
    currentPage: number;
    progress: number;
    lastActivity: string;
  }>;
  recentSessions: Array<{
    id: number;
    userName: string;
    startedAt: string;
    endedAt: string | null;
    duration: number;
  }>;
}

interface Props {
  isOpen: boolean;
  book: Book | null;
}

const props = defineProps<Props>();
defineEmits<{
  close: [];
}>();

const toast = useToast();

const loading = ref(false);
const analytics = ref<Analytics | null>(null);

const fetchAnalytics = async () => {
  if (!props.book) return;

  loading.value = true;
  try {
    const response = await $fetch<Analytics>(
      `/api/library/admin/books/${props.book.id}/analytics`,
    );
    analytics.value = response;
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка загрузки аналитики");
  } finally {
    loading.value = false;
  }
};

const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatDateTime = (date: string) => {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDuration = (seconds: number) => {
  if (!seconds) return "—";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}ч ${minutes}м`;
  }
  return `${minutes}м`;
};

watch(
  () => props.isOpen,
  (isOpen) => {
    if (isOpen && props.book) {
      fetchAnalytics();
    }
  },
);
</script>
