<template>
  <!-- Сводная аналитика библиотеки за период -->
  <div class="space-y-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <span v-if="data?.kpi.readingNow" class="inline-flex items-center gap-1.5 rounded-full bg-success-50 px-2.5 py-1 text-xs font-medium text-success-700 dark:bg-success-500/15 dark:text-success-400">
          <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-success-500" />Сейчас читают: {{ data.kpi.readingNow }}
        </span>
        <span v-else>Сейчас никто не читает</span>
      </div>
      <div class="flex rounded-lg bg-gray-100 p-0.5 dark:bg-white/[0.06]" role="group" aria-label="Период">
        <button
          v-for="p in periods"
          :key="p.value"
          type="button"
          class="rounded-md px-3 py-1 text-xs font-medium transition-colors"
          :class="days === p.value ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'"
          @click="setDays(p.value)"
        >
          {{ p.label }}
        </button>
      </div>
    </div>

    <!-- KPI -->
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4" :class="{ 'opacity-60': loading && data }">
      <UiStat label="Читатели" :value="kpi.readers" :icon="Users" tone="primary" :loading="!data" :hint="trendHint(kpi.readersTrend, `всего читали: ${kpi.readersTotal}`)" />
      <UiStat label="Время чтения" :value="formatDuration(kpi.seconds)" :icon="Clock" tone="info" :loading="!data" :hint="trendHint(kpi.secondsTrend, `${kpi.pagesViewed} листаний`)" />
      <UiStat label="Сессии" :value="kpi.sessions" :icon="BookOpen" tone="neutral" :loading="!data" :hint="trendHint(kpi.sessionsTrend, `книг открывали: ${kpi.booksRead}`)" />
      <UiStat label="Дочитано" :value="kpi.completions" :icon="BookCheck" tone="success" :loading="!data" :hint="`за всё время: ${kpi.completionsTotal}`" />
    </div>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section class="card">
        <div class="mb-4 flex items-baseline justify-between">
          <h3 class="card-title">Активность</h3>
          <span class="text-xs text-gray-500">{{ periodLabel }}</span>
        </div>
        <LibraryActivityChart v-if="data" :points="data.daily" />
        <div v-else class="h-48 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" />
      </section>

      <!-- Требует внимания -->
      <section class="card">
        <h3 class="card-title mb-3">Требует внимания</h3>
        <ul v-if="data" class="space-y-2">
          <li>
            <button type="button" class="attention" :class="attention.withoutAccessCount ? 'warn' : 'ok'" @click="$emit('filter-no-access')">
              <ShieldAlert class="h-4 w-4 shrink-0" />
              <span class="flex-1 text-left">Книги без доступа</span>
              <span class="font-semibold tabular-nums">{{ attention.withoutAccessCount }}</span>
            </button>
          </li>
          <li>
            <div class="attention" :class="attention.expiringAccess.length ? 'warn' : 'ok'">
              <Timer class="h-4 w-4 shrink-0" />
              <span class="flex-1">Доступ истекает за 7 дней</span>
              <span class="font-semibold tabular-nums">{{ attention.expiringAccess.length }}</span>
            </div>
            <ul v-if="attention.expiringAccess.length" class="mt-1 space-y-0.5 pl-9 text-xs text-gray-500">
              <li v-for="e in attention.expiringAccess.slice(0, 4)" :key="e.id" class="truncate">
                {{ formatDate(e.expiresAt) }} · {{ e.target }} → «{{ e.title }}»
              </li>
            </ul>
          </li>
          <li>
            <div class="attention" :class="attention.unreadInPeriodCount ? 'info' : 'ok'">
              <BookDashed class="h-4 w-4 shrink-0" />
              <span class="flex-1">Выданы, но не открывались за период</span>
              <span class="font-semibold tabular-nums">{{ attention.unreadInPeriodCount }}</span>
            </div>
          </li>
          <li v-if="attention.failedBooks">
            <button type="button" class="attention danger" @click="$emit('filter-failed')">
              <AlertCircle class="h-4 w-4 shrink-0" />
              <span class="flex-1 text-left">Ошибки обработки</span>
              <span class="font-semibold tabular-nums">{{ attention.failedBooks }}</span>
            </button>
          </li>
        </ul>
        <div v-else class="space-y-2"><div v-for="i in 3" :key="i" class="h-10 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.04]" /></div>

        <div v-if="data" class="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-4 text-center dark:border-gray-800">
          <div>
            <p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{{ kpi.books }}</p>
            <p class="text-[11px] text-gray-500">книг в фонде</p>
          </div>
          <div>
            <p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">{{ formatNumber(kpi.pages) }}</p>
            <p class="text-[11px] text-gray-500">страниц</p>
          </div>
          <div>
            <p class="text-lg font-semibold tabular-nums text-gray-900 dark:text-white">+{{ kpi.addedBooks }}</p>
            <p class="text-[11px] text-gray-500">новых за период</p>
          </div>
        </div>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <!-- Топ книг -->
      <section class="card">
        <h3 class="card-title mb-3">Популярные книги</h3>
        <ol v-if="data?.topBooks.length" class="space-y-3">
          <li v-for="(b, i) in data.topBooks" :key="b.id">
            <button type="button" class="group flex w-full items-center gap-3 text-left" @click="$emit('open-book', b.id)">
              <span class="w-5 shrink-0 text-right text-xs font-semibold tabular-nums text-gray-400">{{ Number(i) + 1 }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-baseline justify-between gap-2">
                  <p class="truncate text-sm font-medium text-gray-900 group-hover:text-brand-500 dark:text-white">{{ b.title }}</p>
                  <span class="shrink-0 text-xs tabular-nums text-gray-500">{{ b.readers }} чит. · {{ formatDuration(b.seconds) }}</span>
                </div>
                <div class="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                  <div class="h-full rounded-full bg-brand-500" :style="{ width: `${(b.readers / topBooksMax) * 100}%` }" />
                </div>
              </div>
            </button>
          </li>
        </ol>
        <p v-else-if="data" class="py-8 text-center text-sm text-gray-500">За период книги не открывали</p>
      </section>

      <!-- Топ читателей -->
      <section class="card">
        <h3 class="card-title mb-3">Самые активные читатели</h3>
        <ul v-if="data?.topReaders.length" class="divide-y divide-gray-100 dark:divide-gray-800">
          <li v-for="r in data.topReaders" :key="r.id" class="flex items-center gap-3 py-2">
            <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
              {{ initials(r.name) }}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ r.name }}</p>
              <p class="truncate text-xs text-gray-500">{{ r.role }} · {{ r.books }} {{ plural(r.books, "книга", "книги", "книг") }}</p>
            </div>
            <span class="text-sm tabular-nums text-gray-700 dark:text-gray-300">{{ formatDuration(r.seconds) }}</span>
          </li>
        </ul>
        <p v-else-if="data" class="py-8 text-center text-sm text-gray-500">За период никто не читал</p>
      </section>
    </div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section class="card">
        <h3 class="card-title mb-3">Кто читает</h3>
        <div v-if="data?.byRole.length" class="space-y-3">
          <div v-for="r in data.byRole" :key="r.role">
            <div class="mb-1 flex justify-between text-xs">
              <span class="text-gray-700 dark:text-gray-300">{{ r.role }}</span>
              <span class="tabular-nums text-gray-500">{{ r.readers }} чел. · {{ formatDuration(r.seconds) }}</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
              <div class="h-full rounded-full bg-blue-light-500" :style="{ width: `${(r.readers / roleMax) * 100}%` }" />
            </div>
          </div>
        </div>
        <p v-else-if="data" class="py-6 text-center text-sm text-gray-500">Нет данных за период</p>
      </section>

      <section class="card">
        <h3 class="card-title mb-3">Фонд по языкам</h3>
        <div v-if="data?.byLanguage.length" class="flex h-3 overflow-hidden rounded-full">
          <div
            v-for="(l, i) in data.byLanguage"
            :key="l.language"
            :class="langColors[Number(i) % langColors.length]"
            :style="{ width: `${(l.books / kpi.books) * 100}%` }"
            :title="`${langName(l.language)}: ${l.books}`"
          />
        </div>
        <ul v-if="data" class="mt-4 grid gap-2 sm:grid-cols-2">
          <li v-for="(l, i) in data.byLanguage" :key="l.language" class="flex items-center gap-2 text-sm">
            <span class="h-2.5 w-2.5 rounded-sm" :class="langColors[Number(i) % langColors.length]" />
            <span class="text-gray-700 dark:text-gray-300">{{ langName(l.language) }}</span>
            <span class="ml-auto whitespace-nowrap tabular-nums text-gray-500">{{ l.books }} кн. · {{ l.readers }} чит.</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { Users, Clock, BookOpen, BookCheck, ShieldAlert, Timer, BookDashed, AlertCircle } from "lucide-vue-next";
import { useToast } from "~/composables/useToast";

defineEmits<{ "filter-no-access": []; "filter-failed": []; "open-book": [id: string] }>();
const toast = useToast();

const periods = [
  { value: 7, label: "7 дней" },
  { value: 30, label: "30 дней" },
  { value: 90, label: "3 месяца" },
  { value: 365, label: "Год" },
];
const days = ref(30);
const loading = ref(false);
const data = ref<any>(null);

const emptyKpi = {
  books: 0, readyBooks: 0, pages: 0, addedBooks: 0, readers: 0, readersTrend: null, sessions: 0, sessionsTrend: null,
  seconds: 0, secondsTrend: null, pagesViewed: 0, booksRead: 0, completions: 0, completionsTotal: 0, readersTotal: 0, readingNow: 0,
};
const kpi = computed(() => data.value?.kpi || emptyKpi);
const attention = computed(() => data.value?.attention || { withoutAccess: [], unreadInPeriod: [], withoutAccessCount: 0, unreadInPeriodCount: 0, expiringAccess: [], failedBooks: 0 });
const topBooksMax = computed(() => Math.max(1, ...(data.value?.topBooks || []).map((b: any) => b.readers)));
const roleMax = computed(() => Math.max(1, ...(data.value?.byRole || []).map((r: any) => r.readers)));
const periodLabel = computed(() => periods.find((p) => p.value === days.value)?.label);

const langColors = ["bg-brand-500", "bg-success-500", "bg-warning-500", "bg-blue-light-500", "bg-gray-400"];
const langName = (l: string) => ({ ru: "Русский", uz: "O'zbekcha", en: "English", kk: "Қазақша" } as Record<string, string>)[l] || l;

const load = async () => {
  loading.value = true;
  try {
    data.value = await $fetch("/api/library/admin/analytics", { params: { days: days.value } });
  } catch (e: any) {
    toast.error(e?.data?.message || "Не удалось загрузить аналитику");
  } finally {
    loading.value = false;
  }
};
const setDays = (d: number) => {
  days.value = d;
  load();
};

const formatDuration = (sec: number) => {
  if (!sec) return "0 мин";
  const h = Math.floor(sec / 3600);
  const m = Math.round((sec % 3600) / 60);
  return h ? `${h} ч ${m} мин` : `${Math.max(m, 1)} мин`;
};
const formatNumber = (n: number) => n.toLocaleString("ru-RU");
const formatDate = (d: string) => new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
const trendHint = (trend: number | null, fallback: string) =>
  trend === null ? fallback : `${trend >= 0 ? "▲" : "▼"} ${Math.abs(trend)}% к прошлому периоду`;
const initials = (name: string) =>
  (name || "?").split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase();
const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
};

onMounted(load);
defineExpose({ reload: load });
</script>

<style scoped>
.card {
  border-radius: 0.75rem;
  border: 1px solid var(--color-gray-200);
  background: white;
  padding: 1rem 1.25rem;
}
:global(.dark) .card {
  border-color: var(--color-gray-800);
  background: rgb(255 255 255 / 0.03);
}
.card-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-gray-900);
}
:global(.dark) .card-title {
  color: white;
}
.attention {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.75rem;
  border-radius: 0.5rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.attention.ok {
  background: var(--color-gray-50);
  color: var(--color-gray-500);
}
.attention.warn {
  background: var(--color-warning-50);
  color: var(--color-warning-700);
}
.attention.info {
  background: var(--color-blue-light-50);
  color: var(--color-blue-light-700);
}
.attention.danger {
  background: var(--color-error-50);
  color: var(--color-error-700);
}
:global(.dark) .attention.ok { background: rgb(255 255 255 / 0.03); color: var(--color-gray-400); }
:global(.dark) .attention.warn { background: rgb(247 144 9 / 0.12); color: var(--color-warning-400); }
:global(.dark) .attention.info { background: rgb(11 165 236 / 0.12); color: var(--color-blue-light-400); }
:global(.dark) .attention.danger { background: rgb(240 68 56 / 0.12); color: var(--color-error-400); }
</style>
