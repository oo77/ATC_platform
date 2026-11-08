<template>
  <div class="flex flex-col gap-4">
    <div v-if="!stats" class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="i in 8" :key="i" class="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/10"></div>
    </div>

    <template v-else>
      <!-- KPI -->
      <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <UiStat label="Выдано" :value="fmt(stats.summary.issued)" :hint="`всего ${fmt(stats.summary.total)}`" :icon="Award" tone="success" />
        <UiStat label="Отозвано" :value="fmt(stats.summary.revoked)" :icon="XCircle" tone="danger" />
        <UiStat label="За этот месяц" :value="fmt(stats.summary.thisMonth)" :hint="`год: ${fmt(stats.summary.thisYear)}`" :icon="TrendingUp" tone="primary" />
        <UiStat label="Слушателей" :value="fmt(stats.summary.students)" :hint="`${fmt(stats.summary.organizations)} орг.`" :icon="Users" tone="warning" />
        <UiStat label="Групп" :value="fmt(stats.summary.groups)" :icon="Layers" tone="primary" />
        <UiStat label="Курсов с шаблоном" :value="fmt(stats.summary.courses)" :icon="BookOpen" tone="primary" />
        <UiStat label="Срок истёк" :value="fmt(stats.summary.expired)" :icon="AlertTriangle" tone="danger" />
        <UiStat label="Без PDF" :value="fmt(stats.summary.withoutPdf)" :icon="FileWarning" tone="warning" />
      </div>

      <!-- Актуальность PDF + перерисовка -->
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Актуальность PDF выданных сертификатов</h3>
          <span v-if="stats.render.lastRenderedAt" class="text-xs text-gray-400">Последняя отрисовка: {{ dateTime(stats.render.lastRenderedAt) }}</span>
        </div>

        <div v-if="stats.render.regenerable" class="mb-3">
          <div class="flex h-2.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div class="bg-emerald-500" :style="{ width: share(stats.render.current) }"></div>
            <div class="bg-amber-500" :style="{ width: share(stats.render.outdated) }"></div>
            <div class="bg-gray-400" :style="{ width: share(stats.render.unknown) }"></div>
          </div>
          <div class="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-600 dark:text-gray-400">
            <span><i class="mr-1 inline-block h-2 w-2 rounded-full bg-emerald-500"></i>По текущей версии: <b>{{ stats.render.current }}</b></span>
            <span><i class="mr-1 inline-block h-2 w-2 rounded-full bg-amber-500"></i>Шаблон изменён после выдачи: <b>{{ stats.render.outdated }}</b></span>
            <span><i class="mr-1 inline-block h-2 w-2 rounded-full bg-gray-400"></i>Версия неизвестна (старые): <b>{{ stats.render.unknown }}</b></span>
          </div>
        </div>
        <p v-else class="mb-3 text-sm text-gray-500">Нет выданных из журнала сертификатов, которые можно перерисовать.</p>

        <p v-if="stats.render.notRegenerable" class="mb-3 text-xs text-gray-500">
          {{ stats.render.notRegenerable }} выданных сертификатов (импорт, ручной ввод) перерисовать нельзя — у них нет данных группы и слушателя из журнала. Они не затрагиваются.
        </p>

        <!-- Если идёт прогон -->
        <div v-if="job" class="rounded-lg border p-3" :class="job.status === 'running' ? 'border-primary/30 bg-primary/5' : 'border-gray-200 dark:border-gray-800'">
          <div class="mb-1.5 flex items-center justify-between gap-2 text-sm">
            <span class="font-medium">
              {{ statusLabel(job.status) }}
              <span class="text-gray-500">— {{ job.processed }} из {{ job.total }}</span>
            </span>
            <UiButton v-if="job.status === 'running'" variant="outline" size="sm" :disabled="job.cancelRequested" @click="cancel">
              {{ job.cancelRequested ? 'Останавливаю…' : 'Остановить' }}
            </UiButton>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
            <div class="h-full bg-primary transition-all" :style="{ width: (job.total ? job.processed / job.total * 100 : 0) + '%' }"></div>
          </div>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">
            Перерисовано: <b>{{ job.succeeded }}</b> · Пропущено: <b>{{ job.skipped.length }}</b> · Ошибок: <b :class="job.failed.length ? 'text-red-500' : ''">{{ job.failed.length }}</b>
          </p>
          <p v-if="job.error" class="mt-1 text-xs text-red-500">{{ job.error }}</p>
          <details v-if="job.skipped.length || job.failed.length" class="mt-2 text-xs">
            <summary class="cursor-pointer text-gray-600 dark:text-gray-400">Подробности ({{ job.skipped.length + job.failed.length }})</summary>
            <ul class="mt-1 max-h-48 space-y-1 overflow-auto">
              <li v-for="it in job.failed" :key="'f' + it.certificateId" class="text-red-600">✕ {{ it.certificateNumber || it.certificateId }} {{ it.studentName ? '· ' + it.studentName : '' }} — {{ it.reason }}</li>
              <li v-for="it in job.skipped" :key="'s' + it.certificateId" class="text-amber-600">↷ {{ it.certificateNumber || it.certificateId }} {{ it.studentName ? '· ' + it.studentName : '' }} — {{ it.reason }}</li>
            </ul>
          </details>
        </div>

        <!-- Запуск -->
        <div v-else-if="stats.render.regenerable && stats.template.configured" class="space-y-3">
          <div class="flex flex-wrap items-center gap-2">
            <UiButton variant="primary" size="md" :start-icon="RefreshCw" :disabled="busyElsewhere" @click="openModal">
              Перерисовать сертификаты
            </UiButton>
            <UiButton variant="outline" size="md" :loading="previewLoading" @click="runPreview()">Пробный рендер (без сохранения)</UiButton>
            <span v-if="busyElsewhere" class="text-xs text-amber-600">Сейчас идёт перерисовка шаблона «{{ stats.activeJobTemplate?.name }}»</span>
          </div>
        </div>
        <p v-else-if="!stats.template.configured" class="text-sm text-amber-600">Шаблон не настроен в редакторе.</p>
      </section>

      <!-- Динамика -->
      <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
        <h3 class="mb-2 text-sm font-semibold text-gray-900 dark:text-white">Выдача по месяцам (12 мес.)</h3>
        <ChartsDynamicBarChart
          chart-id="tpl-timeline"
          :series="[{ name: 'Выдано', data: stats.timeline.map((t: any) => t.issued) }, { name: 'Отозвано', data: stats.timeline.map((t: any) => t.revoked) }]"
          :categories="stats.timeline.map((t: any) => monthLabel(t.month))"
          :colors="['#10B981', '#EF4444']"
          :show-legend="true"
          :height="240"
        />
      </section>

      <div class="grid gap-4 lg:grid-cols-2">
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Топ организаций</h3>
          <ul class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <li v-for="o in stats.topOrganizations" :key="o.name" class="flex justify-between gap-2 py-1.5"><span class="truncate" :title="o.name">{{ o.name }}</span><span class="tabular-nums">{{ o.total }}</span></li>
            <li v-if="!stats.topOrganizations.length" class="py-6 text-center text-gray-400">Нет данных</li>
          </ul>
        </section>
        <section class="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
          <h3 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Топ курсов</h3>
          <ul class="divide-y divide-gray-100 text-sm dark:divide-gray-800">
            <li v-for="c in stats.topCourses" :key="c.name" class="flex justify-between gap-2 py-1.5"><span class="truncate" :title="c.name">{{ c.name }}</span><span class="tabular-nums">{{ c.total }}</span></li>
            <li v-if="!stats.topCourses.length" class="py-6 text-center text-gray-400">Нет данных</li>
          </ul>
        </section>
      </div>
    </template>

    <!-- Модалка подтверждения -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50" @click="modalOpen = false"></div>
        <div class="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-boxdark">
          <h3 class="mb-3 text-lg font-semibold text-gray-900 dark:text-white">Перерисовать выданные сертификаты</h3>

          <div class="space-y-2 text-sm">
            <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
              <input v-model="scope" type="radio" value="outdated" class="mt-1" />
              <span><b>Только отличающиеся и с неизвестной версией</b> ({{ stats?.render.outdated + stats?.render.unknown }})<br /><span class="text-xs text-gray-500">Те, что отрисованы не по текущей версии шаблона. Рекомендуется.</span></span>
            </label>
            <label class="flex cursor-pointer items-start gap-2 rounded-lg border border-gray-200 p-2.5 dark:border-gray-700">
              <input v-model="scope" type="radio" value="all" class="mt-1" />
              <span><b>Все</b> ({{ stats?.render.regenerable }})<br /><span class="text-xs text-gray-500">Включая уже актуальные.</span></span>
            </label>
          </div>

          <div v-if="stats?.template.usesInstructor" class="mt-3">
            <label class="mb-1 block text-xs font-medium text-gray-500">Инструктор для старых сертификатов, где он не сохранён</label>
            <select v-model="instructorId" class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm dark:border-gray-700 dark:bg-gray-900">
              <option :value="null">Не выбран — такие сертификаты будут пропущены</option>
              <option v-for="i in instructors" :key="i.id" :value="i.id">{{ i.fullName }}</option>
            </select>
          </div>

          <div class="mt-4 rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
            <p class="mb-1 font-semibold">Что изменится</p>
            <ul class="list-disc space-y-0.5 pl-4">
              <li>PDF-файлы будут заменены; ссылки, QR-коды, номера, даты выдачи, сроки и статусы остаются прежними.</li>
              <li>ФИО, организация, должность, данные курса и группы подставятся <b>актуальные</b> — если они менялись после выдачи, на сертификате будет новое значение.</li>
              <li>Средний балл, даты теории/практики и инструктор берутся из снимка выдачи.</li>
              <li>Прежние PDF сохраняются в <code>storage/Certificates/_backup/</code>.</li>
              <li>Отозванные и импортированные сертификаты не затрагиваются.</li>
              <li>Прогон идёт в фоне; при перезапуске сервера он прервётся — запустите заново.</li>
            </ul>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-2">
            <UiButton variant="outline" size="sm" :loading="previewLoading" @click="runPreview(instructorId)">Сначала посмотреть пробный рендер</UiButton>
          </div>

          <label class="mt-4 flex items-start gap-2 text-sm">
            <input v-model="confirmed" type="checkbox" class="mt-0.5" />
            <span>Я понимаю, что файлы выданных сертификатов будут перезаписаны</span>
          </label>

          <div class="mt-5 flex justify-end gap-3">
            <UiButton variant="outline" @click="modalOpen = false">Отмена</UiButton>
            <UiButton variant="primary" :disabled="!confirmed || !affected" :loading="starting" @click="start">
              Перерисовать ({{ affected }})
            </UiButton>
          </div>
        </div>
      </div>

      <!-- Пробный рендер -->
      <div v-if="previewUrl" class="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/60" @click="closePreview"></div>
        <div class="relative flex h-[85vh] w-full max-w-4xl flex-col rounded-xl bg-white p-4 shadow-xl dark:bg-boxdark">
          <div class="mb-2 flex items-center justify-between">
            <span class="text-sm font-medium">Пробный рендер: {{ previewInfo }}</span>
            <UiButton variant="outline" size="sm" @click="closePreview">Закрыть</UiButton>
          </div>
          <iframe :src="previewUrl" class="h-full w-full rounded border-0"></iframe>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { Award, XCircle, TrendingUp, Users, Layers, BookOpen, AlertTriangle, FileWarning, RefreshCw } from 'lucide-vue-next';

const props = defineProps<{ templateId: string; stats: any | null }>();
const emit = defineEmits<{ (e: 'refresh'): void }>();

const { authFetch } = useAuthFetch();
const { success: showSuccess, error: showError } = useNotification();

const job = ref<any>(null);
const modalOpen = ref(false);
const scope = ref<'outdated' | 'all'>('outdated');
const instructorId = ref<string | null>(null);
const instructors = ref<{ id: string; fullName: string }[]>([]);
const confirmed = ref(false);
const starting = ref(false);
const previewLoading = ref(false);
const previewUrl = ref<string | null>(null);
const previewInfo = ref('');
let timer: ReturnType<typeof setInterval> | null = null;

const busyElsewhere = computed(() => !!props.stats?.activeJobId && props.stats.activeJobTemplate?.id !== props.templateId);
const affected = computed(() => {
  const r = props.stats?.render;
  if (!r) return 0;
  return scope.value === 'all' ? r.regenerable : r.outdated + r.unknown;
});

const fmt = (n: number) => Number(n || 0).toLocaleString('ru-RU');
const share = (n: number) => `${props.stats?.render.regenerable ? (n / props.stats.render.regenerable) * 100 : 0}%`;
const dateTime = (d: string) => new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const monthLabel = (m: string) => { const [y, mm] = m.split('-'); return `${MONTHS[Number(mm) - 1]} ${y.slice(2)}`; };
const statusLabel = (s: string) => ({ running: 'Идёт перерисовка', completed: 'Перерисовка завершена', cancelled: 'Остановлено', failed: 'Прервано ошибкой' } as Record<string, string>)[s] || s;

async function openModal() {
  confirmed.value = false;
  modalOpen.value = true;
  if (props.stats?.template.usesInstructor && !instructors.value.length) {
    try {
      const r = await authFetch<any>('/api/instructors/all');
      instructors.value = (r.instructors || []).map((i: any) => ({ id: i.id, fullName: i.fullName || i.full_name }));
    } catch { /* список необязателен */ }
  }
}

async function fetchStatus(jobId?: string) {
  const r = await authFetch<any>(`/api/certificates/templates/${props.templateId}/regenerate-status${jobId ? `?jobId=${jobId}` : ''}`);
  job.value = r.data;
  if (job.value?.status === 'running') startPolling();
  else if (timer) { stopPolling(); emit('refresh'); }
}
function startPolling() {
  if (timer) return;
  timer = setInterval(() => fetchStatus(job.value?.jobId).catch(() => {}), 1500);
}
function stopPolling() { if (timer) { clearInterval(timer); timer = null; } }

async function start() {
  starting.value = true;
  try {
    const r = await authFetch<any>(`/api/certificates/templates/${props.templateId}/regenerate`, {
      method: 'POST',
      body: { scope: scope.value, instructorId: instructorId.value, confirm: true },
    });
    modalOpen.value = false;
    showSuccess(`Перерисовка запущена: ${r.data.total} сертификатов`);
    await fetchStatus(r.data.jobId);
  } catch (e: any) {
    showError(e?.data?.message || e.message || 'Не удалось запустить');
  } finally {
    starting.value = false;
  }
}

async function cancel() {
  if (!job.value) return;
  try {
    await authFetch(`/api/certificates/templates/${props.templateId}/regenerate-cancel`, { method: 'POST', body: { jobId: job.value.jobId } });
    job.value.cancelRequested = true;
  } catch (e: any) {
    showError(e?.data?.message || e.message || 'Не удалось остановить');
  }
}

async function runPreview(instr?: string | null) {
  previewLoading.value = true;
  try {
    const r = await authFetch<any>(`/api/certificates/templates/${props.templateId}/regenerate-preview`, {
      method: 'POST',
      body: { instructorId: instr ?? instructorId.value },
    });
    const bytes = Uint8Array.from(atob(r.data.pdfBase64), (c) => c.charCodeAt(0));
    closePreview();
    previewUrl.value = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
    previewInfo.value = `${r.data.certificateNumber} · ${r.data.studentName}`;
  } catch (e: any) {
    showError(e?.data?.message || e.message || 'Не удалось сделать пробный рендер');
  } finally {
    previewLoading.value = false;
  }
}
function closePreview() {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value);
  previewUrl.value = null;
}

// Подхватываем уже идущий или последний прогон при открытии вкладки
watch(() => props.stats?.latestJobId, (id) => { if (id && !job.value) fetchStatus(id).catch(() => {}); }, { immediate: true });
onBeforeUnmount(() => { stopPolling(); closePreview(); });
</script>
