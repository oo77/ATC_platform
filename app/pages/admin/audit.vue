<template>
  <div class="mx-auto max-w-screen-2xl space-y-4">
    <UiPageHeader
      title="Журнал аудита"
      description="Кто, когда и что сделал: изменения с прежними и новыми значениями, отказы в доступе, входы"
    >
      <template #actions>
        <UiButton variant="outline" :start-icon="Download" :disabled="exporting" @click="exportCsv">
          {{ exporting ? "Выгрузка…" : "Выгрузить CSV" }}
        </UiButton>
      </template>
    </UiPageHeader>

    <UiAlert
      v-if="migrationRequired"
      variant="warning"
      title="Журнал ещё не создан"
      message="Примените миграции базы данных (054_roles_and_audit), после этого события начнут записываться."
    />

    <!-- Фильтры -->
    <div class="grid grid-cols-1 gap-3 rounded-xl border border-gray-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-6 dark:border-gray-800 dark:bg-white/[0.03]">
      <input
        v-model="filters.q"
        type="search"
        placeholder="Поиск: описание, объект, пользователь, адрес"
        class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm lg:col-span-2 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
        @keyup.enter="applyFilters"
      />
      <select v-model="filters.category" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
        <option value="">Все категории</option>
        <option v-for="(label, key) in CATEGORY_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="filters.outcome" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white">
        <option value="">Любой результат</option>
        <option v-for="(label, key) in OUTCOME_LABELS" :key="key" :value="key">{{ label }}</option>
      </select>
      <input v-model="filters.from" type="date" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
      <input v-model="filters.to" type="date" class="h-9 rounded-lg border border-gray-300 bg-white px-3 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white" />
      <div class="flex flex-wrap items-center gap-2 sm:col-span-2 lg:col-span-6">
        <UiButton size="sm" variant="primary" @click="applyFilters">Применить</UiButton>
        <UiButton size="sm" variant="ghost" @click="resetFilters">Сбросить</UiButton>
        <span v-if="filters.actorId" class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Пользователь: {{ actorLabel || filters.actorId }}
          <button type="button" aria-label="Убрать фильтр" @click="filters.actorId = ''; actorLabel = ''; applyFilters()">×</button>
        </span>
        <span v-if="filters.requestId" class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          Один запрос
          <button type="button" aria-label="Убрать фильтр" @click="filters.requestId = ''; applyFilters()">×</button>
        </span>
        <span v-if="filters.entityId" class="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-1 text-xs text-brand-700 dark:bg-brand-500/10 dark:text-brand-300">
          История объекта
          <button type="button" aria-label="Убрать фильтр" @click="filters.entityId = ''; filters.entityType = ''; applyFilters()">×</button>
        </span>
        <span class="ml-auto text-xs text-gray-500">Найдено: {{ total }}</span>
      </div>
    </div>

    <!-- Лента -->
    <div class="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
      <div v-if="loading" class="space-y-2 p-4">
        <div v-for="i in 8" :key="i" class="h-12 animate-pulse rounded-lg bg-gray-100 dark:bg-white/[0.05]" />
      </div>
      <div v-else-if="!events.length" class="px-6 py-16 text-center text-sm text-gray-500">Событий не найдено</div>
      <ul v-else class="divide-y divide-gray-100 dark:divide-gray-800">
        <li v-for="e in events" :key="e.id">
          <button
            type="button"
            class="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-white/[0.03]"
            @click="toggle(e.id)"
          >
            <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full" :class="OUTCOME_DOT[e.outcome] || 'bg-gray-300'" />
            <div class="min-w-0 flex-1">
              <p class="text-sm text-gray-900 dark:text-white">
                <b>{{ e.actorName || "Система" }}</b>
                <span v-if="e.actorRole" class="text-gray-500"> ({{ e.actorRole }})</span>
                — {{ e.summary }}
              </p>
              <p class="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                {{ formatTime(e.occurredAt) }}
                · {{ CATEGORY_LABELS[e.category] || e.category }}
                <span v-if="e.outcome !== 'success'" :class="e.outcome === 'denied' ? 'text-red-600' : 'text-amber-600'">
                  · {{ OUTCOME_LABELS[e.outcome] }}</span>
                <span v-if="e.changes?.length"> · изменено полей: {{ e.changes.length }}</span>
                <span v-if="e.source && e.source !== 'web'"> · {{ SOURCE_LABELS[e.source] || e.source }}</span>
              </p>
            </div>
            <ChevronDown class="mt-1 h-4 w-4 shrink-0 text-gray-400 transition-transform" :class="expanded.has(e.id) ? 'rotate-180' : ''" />
          </button>

          <div v-if="expanded.has(e.id)" class="space-y-3 bg-gray-50 px-4 py-3 text-sm dark:bg-white/[0.02]">
            <table v-if="e.changes?.length" class="w-full text-left text-xs">
              <thead class="text-gray-500">
                <tr><th class="py-1 pr-3 font-medium">Поле</th><th class="py-1 pr-3 font-medium">Было</th><th class="py-1 font-medium">Стало</th></tr>
              </thead>
              <tbody>
                <tr v-for="c in e.changes" :key="c.field" class="align-top">
                  <td class="py-1 pr-3 font-medium text-gray-700 dark:text-gray-300">{{ c.label || c.field }}</td>
                  <td class="py-1 pr-3 text-red-700 dark:text-red-400">{{ formatValue(c.before) }}</td>
                  <td class="py-1 text-green-700 dark:text-green-400">{{ formatValue(c.after) }}</td>
                </tr>
              </tbody>
            </table>

            <dl class="grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-gray-600 sm:grid-cols-2 dark:text-gray-400">
              <div v-if="e.entityType"><dt class="inline text-gray-400">Объект: </dt><dd class="inline">{{ e.entityType }}{{ e.entityLabel ? ` · ${e.entityLabel}` : "" }}{{ e.entityId ? ` · ${e.entityId}` : "" }}</dd></div>
              <div><dt class="inline text-gray-400">Действие: </dt><dd class="inline font-mono">{{ e.action }}</dd></div>
              <div v-if="e.path"><dt class="inline text-gray-400">Запрос: </dt><dd class="inline font-mono">{{ e.method }} {{ e.path }} {{ e.status ? `→ ${e.status}` : "" }}</dd></div>
              <div v-if="e.ip"><dt class="inline text-gray-400">IP: </dt><dd class="inline font-mono">{{ e.ip }}</dd></div>
              <div v-if="e.userAgent" class="sm:col-span-2"><dt class="inline text-gray-400">Устройство: </dt><dd class="inline">{{ e.userAgent }}</dd></div>
              <div v-if="e.metadata && Object.keys(e.metadata).length" class="sm:col-span-2">
                <dt class="text-gray-400">Подробности:</dt>
                <dd class="mt-1 overflow-x-auto rounded bg-white p-2 font-mono text-[11px] dark:bg-gray-900">{{ JSON.stringify(e.metadata, null, 2) }}</dd>
              </div>
            </dl>

            <div class="flex flex-wrap gap-2">
              <UiButton v-if="e.actorId" size="xs" variant="outline" @click="filterActor(e)">Все действия пользователя</UiButton>
              <UiButton v-if="e.entityId" size="xs" variant="outline" @click="filterEntity(e)">История объекта</UiButton>
              <UiButton v-if="e.requestId" size="xs" variant="ghost" @click="filterRequest(e)">Весь запрос</UiButton>
            </div>
          </div>
        </li>
      </ul>
    </div>

    <div v-if="total > limit" class="flex items-center justify-between text-sm">
      <span class="text-gray-500">Страница {{ page }} из {{ pages }}</span>
      <div class="flex gap-2">
        <UiButton size="sm" variant="outline" :disabled="page <= 1" @click="go(page - 1)">Назад</UiButton>
        <UiButton size="sm" variant="outline" :disabled="page >= pages" @click="go(page + 1)">Вперёд</UiButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { ChevronDown, Download } from "lucide-vue-next";

definePageMeta({ layout: "default", title: "Журнал аудита" });

const CATEGORY_LABELS: Record<string, string> = {
  data: "Изменение данных",
  security: "Безопасность",
  auth: "Вход и выход",
  access: "Просмотр и выгрузка",
  system: "Система",
};
const OUTCOME_LABELS: Record<string, string> = { success: "Успешно", denied: "Отказано в доступе", failed: "Ошибка" };
const OUTCOME_DOT: Record<string, string> = { success: "bg-green-500", denied: "bg-red-500", failed: "bg-amber-500" };
const SOURCE_LABELS: Record<string, string> = { telegram: "Telegram", system: "Система", integration: "Интеграция" };

const route = useRoute();
const { authFetch } = useAuthFetch();
const notify = useNotification();

const events = ref<any[]>([]);
const total = ref(0);
const page = ref(1);
const limit = 50;
const loading = ref(true);
const exporting = ref(false);
const migrationRequired = ref(false);
const expanded = ref(new Set<number>());
const actorLabel = ref("");

const filters = reactive({
  q: "",
  category: "",
  outcome: "",
  from: "",
  to: "",
  actorId: String(route.query.actorId || ""),
  entityType: String(route.query.entityType || ""),
  entityId: String(route.query.entityId || ""),
  requestId: "",
});

const pages = computed(() => Math.max(1, Math.ceil(total.value / limit)));

function query(extra: Record<string, any> = {}) {
  const q: Record<string, any> = { page: page.value, limit, ...extra };
  for (const [k, v] of Object.entries(filters)) if (v) q[k] = v;
  return q;
}

async function load() {
  loading.value = true;
  try {
    const res: any = await authFetch("/api/audit-events", { query: query() });
    events.value = res.events || [];
    total.value = res.total || 0;
    migrationRequired.value = !!res.migrationRequired;
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось загрузить журнал");
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  page.value = 1;
  expanded.value = new Set();
  load();
}
function resetFilters() {
  Object.assign(filters, { q: "", category: "", outcome: "", from: "", to: "", actorId: "", entityType: "", entityId: "", requestId: "" });
  actorLabel.value = "";
  applyFilters();
}
function go(p: number) {
  page.value = p;
  load();
}
function toggle(id: number) {
  const next = new Set(expanded.value);
  next.has(id) ? next.delete(id) : next.add(id);
  expanded.value = next;
}
function filterActor(e: any) {
  filters.actorId = e.actorId;
  actorLabel.value = e.actorName || "";
  applyFilters();
}
function filterEntity(e: any) {
  filters.entityType = e.entityType || "";
  filters.entityId = e.entityId;
  applyFilters();
}
function filterRequest(e: any) {
  filters.requestId = e.requestId;
  applyFilters();
}

function formatTime(v: string) {
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function formatValue(v: any): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "object") {
    if (Array.isArray(v.added) || Array.isArray(v.removed)) {
      return [v.added?.length ? `+ ${v.added.join(", ")}` : "", v.removed?.length ? `− ${v.removed.join(", ")}` : ""]
        .filter(Boolean)
        .join("  ");
    }
    return JSON.stringify(v);
  }
  if (typeof v === "boolean") return v ? "да" : "нет";
  return String(v);
}

async function exportCsv() {
  exporting.value = true;
  try {
    const blob: Blob = await authFetch("/api/audit-events", { query: query({ format: "csv", page: 1 }), responseType: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось выгрузить журнал");
  } finally {
    exporting.value = false;
  }
}

onMounted(load);
</script>
