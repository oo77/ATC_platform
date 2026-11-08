<template>
  <UiModal :is-open="isOpen" title="Аналитика книги" size="xl" @close="$emit('close')">
    <div v-if="book" class="space-y-6">
      <!-- Книга + период -->
      <div class="flex flex-wrap items-center gap-4">
        <LibraryBookCover :url="book.cover_url" :title="book.title" :width="80" compact class="w-11 shrink-0" />
        <div class="min-w-0 flex-1">
          <h3 class="truncate font-semibold text-gray-900 dark:text-white">{{ book.title }}</h3>
          <p class="truncate text-sm text-gray-500 dark:text-gray-400">
            {{ book.author || "Автор не указан" }}<template v-if="data"> · {{ data.book.totalPages }} стр.</template>
          </p>
        </div>
        <span v-if="data?.summary.readingNow" class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />Читают сейчас: {{ data.summary.readingNow }}
        </span>
        <select v-model.number="days" class="h-9 rounded-lg border border-gray-300 bg-transparent px-2 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200" aria-label="Период" @change="load">
          <option :value="7">7 дней</option>
          <option :value="30">30 дней</option>
          <option :value="90">90 дней</option>
          <option :value="365">Год</option>
        </select>
      </div>

      <div v-if="loading && !data" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div v-for="i in 4" :key="i" class="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-white/[0.04]" />
      </div>

      <template v-else-if="data">
        <!-- KPI -->
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" :class="{ 'opacity-60': loading }">
          <UiStat label="Читателей" :value="data.summary.readers" :icon="Users" tone="primary" :hint="`за период: ${data.summary.periodReaders}`" />
          <UiStat label="Дочитали" :value="`${data.summary.completed}`" :icon="BookCheck" tone="success" :hint="`${data.summary.completionRate}% читателей`" :progress="data.summary.completionRate" />
          <UiStat label="Время чтения" :value="formatDuration(data.summary.totalSeconds)" :icon="Clock" tone="info" :hint="`≈ ${formatDuration(data.summary.avgSecondsPerReader)} на читателя`" />
          <UiStat label="Средний прогресс" :value="`${data.summary.averageProgress}%`" :icon="TrendingUp" tone="warning" :hint="`${data.summary.sessions} сессий, ${data.summary.pagesViewed} листаний`" :progress="data.summary.averageProgress" />
        </div>

        <div class="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
          <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h4 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Активность по дням</h4>
            <LibraryActivityChart :points="data.daily" />
          </section>

          <!-- Где останавливаются читатели -->
          <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white">Докуда дочитывают</h4>
            <p class="mb-4 text-xs text-gray-500">Распределение читателей по прогрессу</p>
            <div class="space-y-3">
              <div v-for="(b, i) in data.distribution" :key="b.label">
                <div class="mb-1 flex justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-300">{{ b.label }}</span>
                  <span class="tabular-nums text-gray-500">{{ b.value }}</span>
                </div>
                <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                  <div
                    class="h-full rounded-full transition-all duration-500"
                    :class="i === data.distribution.length - 1 ? 'bg-success-500' : 'bg-brand-500'"
                    :style="{ width: `${maxBucket ? (b.value / maxBucket) * 100 : 0}%`, opacity: 0.45 + Number(i) * 0.13 }"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- Читатели / сессии -->
        <section class="rounded-xl border border-gray-200 dark:border-gray-800">
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 px-4 pt-2 dark:border-gray-800">
            <UiTabs v-model="tab" :tabs="tabs" class="-mb-px border-b-0" />
            <input
              v-if="tab === 'readers'"
              v-model="readerSearch"
              type="search"
              placeholder="Найти читателя…"
              class="mb-2 h-8 w-48 rounded-lg border border-gray-300 bg-transparent px-3 text-xs dark:border-gray-700 dark:text-gray-200"
            />
          </div>

          <div class="max-h-80 overflow-y-auto">
            <table v-if="tab === 'readers'" class="w-full text-sm">
              <thead class="sticky top-0 bg-white text-xs text-gray-500 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-2 text-left font-medium">Читатель</th>
                  <th class="px-4 py-2 text-left font-medium">Прогресс</th>
                  <th class="hidden px-4 py-2 text-right font-medium sm:table-cell">Время</th>
                  <th class="hidden px-4 py-2 text-right font-medium md:table-cell">Сессий</th>
                  <th class="px-4 py-2 text-right font-medium">Последнее чтение</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="r in filteredReaders" :key="r.userId">
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <span v-if="r.readingNow" class="h-2 w-2 shrink-0 rounded-full bg-success-500" title="Читает сейчас" />
                      <div class="min-w-0">
                        <p class="truncate font-medium text-gray-900 dark:text-white">{{ r.name }}</p>
                        <p class="truncate text-xs text-gray-500">{{ r.role }} · {{ r.email }}</p>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-2.5">
                    <div class="flex items-center gap-2">
                      <div class="h-1.5 w-20 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                        <div class="h-full rounded-full" :class="r.completedAt ? 'bg-success-500' : 'bg-brand-500'" :style="{ width: `${r.progress}%` }" />
                      </div>
                      <span class="text-xs tabular-nums text-gray-500">{{ r.progress }}%</span>
                    </div>
                    <p class="mt-0.5 text-[11px] text-gray-400">стр. {{ r.currentPage }}<template v-if="r.maxPage > r.currentPage"> (макс. {{ r.maxPage }})</template></p>
                  </td>
                  <td class="hidden px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300 sm:table-cell">{{ formatDuration(r.totalSeconds) }}</td>
                  <td class="hidden px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300 md:table-cell">{{ r.sessions }}</td>
                  <td class="px-4 py-2.5 text-right text-xs text-gray-500">{{ relative(r.lastReadAt) }}</td>
                </tr>
                <tr v-if="!filteredReaders.length">
                  <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">{{ data.readers.length ? "Никого не нашли" : "Книгу ещё никто не открывал" }}</td>
                </tr>
              </tbody>
            </table>

            <table v-else class="w-full text-sm">
              <thead class="sticky top-0 bg-white text-xs text-gray-500 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-2 text-left font-medium">Читатель</th>
                  <th class="px-4 py-2 text-left font-medium">Начало</th>
                  <th class="px-4 py-2 text-right font-medium">Чтение</th>
                  <th class="hidden px-4 py-2 text-right font-medium sm:table-cell">Листаний</th>
                  <th class="px-4 py-2 text-right font-medium">Статус</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-800">
                <tr v-for="s in data.recentSessions" :key="s.id">
                  <td class="px-4 py-2.5 font-medium text-gray-900 dark:text-white">{{ s.userName }}</td>
                  <td class="px-4 py-2.5 text-xs text-gray-500">{{ formatDateTime(s.startedAt) }}</td>
                  <td class="px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300">{{ formatDuration(s.activeSeconds) }}</td>
                  <td class="hidden px-4 py-2.5 text-right tabular-nums text-gray-600 dark:text-gray-300 sm:table-cell">{{ s.pagesViewed }}</td>
                  <td class="px-4 py-2.5 text-right">
                    <UiBadge v-if="s.isActive" size="sm" color="success">Читает</UiBadge>
                    <span v-else class="text-xs text-gray-400">стр. {{ s.currentPage }}</span>
                  </td>
                </tr>
                <tr v-if="!data.recentSessions.length">
                  <td colspan="5" class="px-4 py-8 text-center text-sm text-gray-500">Сессий пока не было</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
        <p class="text-xs text-gray-400">
          Время чтения считается только пока книга открыта на экране и читатель активен; простой дольше двух минут не засчитывается.
        </p>
      </template>
    </div>
  </UiModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { Users, BookCheck, Clock, TrendingUp } from "lucide-vue-next";
import { useToast } from "~/composables/useToast";

interface Book { id: string; title: string; author: string | null; cover_url: string | null }
const props = defineProps<{ isOpen: boolean; book: Book | null }>();
defineEmits<{ close: [] }>();
const toast = useToast();

const loading = ref(false);
const data = ref<any>(null);
const days = ref(30);
const tab = ref("readers");
const readerSearch = ref("");

const tabs = computed(() => [
  { id: "readers", label: "Читатели", count: data.value?.readers.length ?? null },
  { id: "sessions", label: "Последние сессии", count: data.value?.recentSessions.length ?? null },
]);
const maxBucket = computed(() => Math.max(0, ...(data.value?.distribution || []).map((b: any) => b.value)));
const filteredReaders = computed(() => {
  const q = readerSearch.value.trim().toLowerCase();
  const list = data.value?.readers || [];
  return q ? list.filter((r: any) => `${r.name} ${r.email}`.toLowerCase().includes(q)) : list;
});

const load = async () => {
  if (!props.book) return;
  loading.value = true;
  try {
    data.value = await $fetch(`/api/library/admin/books/${props.book.id}/analytics`, { params: { days: days.value } });
  } catch (e: any) {
    toast.error(e?.data?.message || "Не удалось загрузить аналитику");
  } finally {
    loading.value = false;
  }
};

const formatDuration = (sec: number) => {
  if (!sec) return "—";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} ч ${m} мин` : `${Math.max(m, 1)} мин`;
};
const formatDateTime = (d: string) =>
  new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const relative = (d: string | null) => {
  if (!d) return "—";
  const diff = Date.now() - new Date(d).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "только что";
  if (min < 60) return `${min} мин назад`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} ч назад`;
  const dd = Math.round(h / 24);
  return dd < 30 ? `${dd} дн. назад` : new Date(d).toLocaleDateString("ru-RU");
};

watch(
  () => [props.isOpen, props.book?.id],
  ([open]) => {
    if (open && props.book) {
      data.value = null;
      readerSearch.value = "";
      tab.value = "readers";
      load();
    }
  },
  { immediate: true },
);
</script>
