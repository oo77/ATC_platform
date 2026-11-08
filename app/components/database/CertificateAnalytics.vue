<template>
  <div class="flex flex-col gap-4">
    <!-- Период и обновление -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <p class="text-sm text-gray-500 dark:text-gray-400">
        Только действующие сертификаты, если не указано иное
      </p>
      <div class="flex items-center gap-2">
        <select
          v-model.number="months"
          class="h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          @change="load"
        >
          <option :value="6">6 месяцев</option>
          <option :value="12">12 месяцев</option>
          <option :value="24">24 месяца</option>
          <option :value="36">36 месяцев</option>
        </select>
        <UiButton variant="outline" size="md" :disabled="loading" @click="load">Обновить</UiButton>
      </div>
    </div>

    <div v-if="loading && !data" class="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div v-for="i in 8" :key="i" class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10"></div>
    </div>

    <template v-else-if="data">
      <!-- KPI -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UiStat label="Всего записей" :value="fmt(s.total)" :hint="`${fmt(s.issued)} действ.`" :icon="Award" tone="primary" />
        <UiStat label="За этот месяц" :value="fmt(s.thisMonth)" :hint="monthDelta" :icon="TrendingUp" tone="success" />
        <UiStat label="За этот год" :value="fmt(s.thisYear)" :icon="CalendarDays" tone="primary" />
        <UiStat label="Слушателей" :value="fmt(s.students)" :hint="`${fmt(s.organizations)} орг.`" :icon="Users" tone="warning" />
        <UiStat label="Истекают в 30 дней" :value="fmt(s.expiring30)" :hint="`90 дн.: ${fmt(s.expiring90)}`" :icon="Clock" tone="warning" />
        <UiStat label="Срок истёк" :value="fmt(s.expired)" :icon="AlertTriangle" tone="danger" />
        <UiStat label="Отозвано" :value="fmt(s.revoked)" :hint="s.total ? pct(s.revoked, s.total) : ''" :icon="XCircle" tone="danger" />
        <UiStat label="Без PDF" :value="fmt(s.withoutPdf)" :hint="`с предупр.: ${fmt(s.withWarnings)}`" :icon="FileWarning" tone="warning" />
      </div>

      <!-- Динамика -->
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Выдача по месяцам</h3>
        <ChartsDynamicBarChart
          chart-id="cert-timeline"
          :series="[{ name: 'Выдано', data: data.timeline.map((t: any) => t.issued) }, { name: 'Отозвано', data: data.timeline.map((t: any) => t.revoked) }]"
          :categories="data.timeline.map((t: any) => monthLabel(t.month))"
          :colors="['#10B981', '#EF4444']"
          :show-legend="true"
          :height="280"
        />
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Источники</h3>
          <ChartsDonutChart
            v-if="data.bySource.length"
            chart-id="cert-sources"
            :series="data.bySource.map((x: any) => x.count)"
            :labels="data.bySource.map((x: any) => sourceLabel(x.source))"
            :height="260"
          />
          <p v-else class="py-8 text-center text-sm text-gray-400">Нет данных</p>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Шаблоны</h3>
          <ChartsDonutChart
            v-if="data.byTemplate.length"
            chart-id="cert-templates"
            :series="data.byTemplate.map((x: any) => x.total)"
            :labels="data.byTemplate.map((x: any) => x.name)"
            :height="260"
          />
          <p v-else class="py-8 text-center text-sm text-gray-400">Нет данных</p>
        </section>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Топ организаций</h3>
          <table class="w-full text-sm">
            <thead class="text-left text-xs text-gray-500"><tr><th class="pb-2">Организация</th><th class="pb-2 text-right">Слуш.</th><th class="pb-2 text-right">Действ.</th><th class="pb-2 text-right">Отозв.</th></tr></thead>
            <tbody>
              <tr v-for="o in data.topOrganizations" :key="o.name" class="border-t border-gray-100 dark:border-gray-800">
                <td class="max-w-[220px] truncate py-1.5" :title="o.name">{{ o.name }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ o.students }}</td>
                <td class="py-1.5 text-right tabular-nums">{{ o.issued }}</td>
                <td class="py-1.5 text-right tabular-nums text-red-500">{{ o.revoked }}</td>
              </tr>
              <tr v-if="!data.topOrganizations.length"><td colspan="4" class="py-6 text-center text-gray-400">Нет данных</td></tr>
            </tbody>
          </table>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Топ курсов</h3>
          <ul class="space-y-2">
            <li v-for="c in data.topCourses" :key="c.name">
              <div class="flex justify-between gap-2 text-sm"><span class="truncate" :title="c.name">{{ c.name }}</span><span class="tabular-nums">{{ c.total }}</span></div>
              <div class="mt-1 h-1.5 rounded-full bg-gray-100 dark:bg-white/10"><div class="h-full rounded-full bg-primary" :style="{ width: (c.total / maxCourse * 100) + '%' }"></div></div>
            </li>
            <li v-if="!data.topCourses.length" class="py-6 text-center text-sm text-gray-400">Нет данных</li>
          </ul>
        </section>
      </div>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Скоро истекают (30 дней)</h3>
          <ul class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <li v-for="e in data.expiringSoon" :key="e.id" class="flex items-center justify-between gap-2 py-2">
              <span class="min-w-0"><span class="block truncate">{{ e.studentName }}</span><span class="block truncate text-xs text-gray-400">№ {{ e.certificateNumber }} · {{ e.organization || '—' }}</span></span>
              <span class="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">{{ e.daysLeft }} дн.</span>
            </li>
            <li v-if="!data.expiringSoon.length" class="py-6 text-center text-gray-400">Нет истекающих сертификатов</li>
          </ul>
        </section>

        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Причины отзыва</h3>
          <ul class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <li v-for="r in data.revokeReasons" :key="r.reason" class="flex justify-between gap-2 py-2"><span class="truncate" :title="r.reason">{{ r.reason }}</span><span class="tabular-nums">{{ r.count }}</span></li>
            <li v-if="!data.revokeReasons.length" class="py-6 text-center text-gray-400">Отозванных нет</li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { Award, TrendingUp, CalendarDays, Users, Clock, AlertTriangle, XCircle, FileWarning } from 'lucide-vue-next';

const { authFetch } = useAuthFetch();
const notification = useNotification();

const data = ref<any>(null);
const loading = ref(false);
const months = ref(12);

const s = computed(() => data.value?.summary ?? {});
const maxCourse = computed(() => Math.max(1, ...(data.value?.topCourses ?? []).map((c: any) => c.total)));

const fmt = (n: number) => Number(n || 0).toLocaleString('ru-RU');
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 1000) / 10}%` : '');
const monthDelta = computed(() => {
  const { thisMonth = 0, prevMonth = 0 } = s.value;
  if (!prevMonth) return `прошлый: ${prevMonth}`;
  const d = Math.round(((thisMonth - prevMonth) / prevMonth) * 100);
  return `${d >= 0 ? '+' : ''}${d}% к прошлому`;
});
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const monthLabel = (m: string) => { const [y, mm] = m.split('-'); return `${MONTHS[Number(mm) - 1]} ${y.slice(2)}`; };
const sourceLabel = (src: string) => ({ group_journal: 'Журнал группы', excel: 'Excel', ai: 'AI-импорт', manual: 'Ручной ввод' } as Record<string, string>)[src] || src;

async function load() {
  loading.value = true;
  try {
    const res = await authFetch(`/api/certificates/analytics?months=${months.value}`);
    if (res.success) data.value = res.data;
  } catch (e: any) {
    notification.error('Ошибка загрузки', e.message || 'Не удалось загрузить аналитику');
  } finally {
    loading.value = false;
  }
}

onMounted(load);
</script>
