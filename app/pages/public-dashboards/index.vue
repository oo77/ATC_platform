<template>
  <div class="mx-auto max-w-screen-2xl">
    <UiPageHeader
      title="Публичные дашборды"
      description="Дашборды по ссылке для экранов в холле, ТВ и заказчиков — без входа в систему"
    >
      <template #actions>
        <UiButton variant="primary" :start-icon="Plus" to="/public-dashboards/new">Создать дашборд</UiButton>
      </template>
    </UiPageHeader>

    <!-- Загрузка -->
    <div v-if="loading" class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div v-for="i in 3" :key="i" class="h-44 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]" />
    </div>

    <!-- Пусто -->
    <div
      v-else-if="!items.length"
      class="flex flex-col items-center rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-white/[0.03]"
    >
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">
        <MonitorPlay class="h-6 w-6" />
      </div>
      <h2 class="text-base font-semibold text-gray-900 dark:text-white">Публичных дашбордов пока нет</h2>
      <p class="mt-1 max-w-md text-sm text-gray-500 dark:text-gray-400">
        Соберите дашборд из готовых виджетов — статистика, графики, расписание — и откройте его по ссылке на любом экране.
      </p>
      <UiButton class-name="mt-5" variant="primary" :start-icon="Plus" to="/public-dashboards/new">Создать первый дашборд</UiButton>
    </div>

    <!-- Список -->
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="d in items"
        :key="d.id"
        class="flex flex-col rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <div class="flex items-start justify-between gap-3">
          <NuxtLink :to="`/public-dashboards/${d.id}`" class="min-w-0">
            <h3 class="truncate text-base font-semibold text-gray-900 hover:text-brand-500 dark:text-white">{{ d.title }}</h3>
            <p class="mt-0.5 line-clamp-1 text-sm text-gray-500 dark:text-gray-400">{{ d.description || "Без описания" }}</p>
          </NuxtLink>
          <span class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium" :class="status(d).cls">{{ status(d).label }}</span>
        </div>

        <dl class="mt-4 grid grid-cols-3 gap-2 text-center">
          <div class="rounded-lg bg-gray-50 py-2 dark:bg-white/[0.04]">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Виджетов</dt>
            <dd class="text-sm font-semibold text-gray-900 dark:text-white">{{ d.widgets.length }}</dd>
          </div>
          <div class="rounded-lg bg-gray-50 py-2 dark:bg-white/[0.04]">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Просмотров</dt>
            <dd class="text-sm font-semibold text-gray-900 dark:text-white">{{ d.viewCount.toLocaleString("ru-RU") }}</dd>
          </div>
          <div class="rounded-lg bg-gray-50 py-2 dark:bg-white/[0.04]">
            <dt class="text-xs text-gray-500 dark:text-gray-400">Открывали</dt>
            <dd class="truncate px-1 text-sm font-semibold text-gray-900 dark:text-white">{{ d.lastViewedAt ? relative(d.lastViewedAt) : "—" }}</dd>
          </div>
        </dl>

        <div class="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <span v-if="d.hasPassword" class="inline-flex items-center gap-1"><Lock class="h-3.5 w-3.5" /> С паролем</span>
          <span v-if="d.expiresAt" class="inline-flex items-center gap-1"><CalendarClock class="h-3.5 w-3.5" /> до {{ formatDate(d.expiresAt) }}</span>
          <span>Изменён {{ formatDate(d.updatedAt) }}</span>
        </div>

        <div class="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4 dark:border-gray-800">
          <UiButton size="sm" variant="primary" :start-icon="Pencil" :to="`/public-dashboards/${d.id}`">Настроить</UiButton>
          <button
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
            title="Скопировать ссылку"
            aria-label="Скопировать публичную ссылку"
            @click="copyLink(d)"
          >
            <Copy class="h-4 w-4" />
          </button>
          <a
            :href="publicUrl(d)"
            target="_blank"
            rel="noopener"
            class="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-brand-500 dark:border-gray-700 dark:text-gray-400"
            title="Открыть"
            aria-label="Открыть публичную ссылку"
          >
            <ExternalLink class="h-4 w-4" />
          </a>
          <div class="ml-auto flex shrink-0 items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">{{ d.isActive ? "Вкл." : "Выкл." }}</span>
            <UiSwitch :model-value="d.isActive" @update:model-value="(v: boolean) => toggleActive(d, v)" />
            <button
              class="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
              title="Удалить"
              aria-label="Удалить дашборд"
              @click="toDelete = d"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <UiConfirmModal
      :is-open="!!toDelete"
      title="Удалить дашборд?"
      :item-name="toDelete?.title"
      message="Публичная ссылка перестанет работать на всех экранах. Это действие нельзя отменить."
      confirm-text="Удалить"
      variant="danger"
      :loading="deleting"
      @confirm="confirmDelete"
      @cancel="toDelete = null"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { CalendarClock, Copy, ExternalLink, Lock, MonitorPlay, Pencil, Plus, Trash2 } from "lucide-vue-next";

definePageMeta({ layout: "default", title: "Публичные дашборды" });
useHead({ title: "Публичные дашборды" });

interface Item {
  id: string;
  title: string;
  description: string | null;
  token: string;
  widgets: any[];
  settings: any;
  isActive: boolean;
  hasPassword: boolean;
  expiresAt: string | null;
  viewCount: number;
  lastViewedAt: string | null;
  updatedAt: string;
}

const { authFetch } = useAuthFetch();
const notify = useNotification();

const items = ref<Item[]>([]);
const loading = ref(true);
const toDelete = ref<Item | null>(null);
const deleting = ref(false);

async function load() {
  loading.value = true;
  try {
    const res = await authFetch<{ data: Item[] }>("/api/public-dashboards");
    items.value = res.data;
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось загрузить дашборды");
  } finally {
    loading.value = false;
  }
}

const publicUrl = (d: Item) => `${window.location.origin}/d/${d.token}`;

async function copyLink(d: Item) {
  try {
    await navigator.clipboard.writeText(publicUrl(d));
    notify.success("Ссылка скопирована");
  } catch {
    notify.error("Не удалось скопировать ссылку");
  }
}

function status(d: Item) {
  if (!d.isActive) return { label: "Отключена", cls: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  if (d.expiresAt && new Date(d.expiresAt).getTime() < Date.now())
    return { label: "Истекла", cls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" };
  return { label: "Активна", cls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400" };
}

async function toggleActive(d: Item, value: boolean) {
  const prev = d.isActive;
  d.isActive = value;
  try {
    await authFetch(`/api/public-dashboards/${d.id}`, {
      method: "PUT",
      body: {
        title: d.title,
        description: d.description,
        widgets: d.widgets,
        settings: d.settings,
        isActive: value,
        expiresAt: d.expiresAt,
      },
    });
    notify.success(value ? "Ссылка включена" : "Ссылка отключена");
  } catch (e: any) {
    d.isActive = prev;
    notify.error(e?.data?.message || "Не удалось изменить статус");
  }
}

async function confirmDelete() {
  if (!toDelete.value) return;
  deleting.value = true;
  try {
    await authFetch(`/api/public-dashboards/${toDelete.value.id}`, { method: "DELETE" });
    items.value = items.value.filter((i) => i.id !== toDelete.value!.id);
    notify.success("Дашборд удалён");
    toDelete.value = null;
  } catch (e: any) {
    notify.error(e?.data?.message || "Не удалось удалить");
  } finally {
    deleting.value = false;
  }
}

const formatDate = (v: string) => new Date(v).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });

function relative(v: string) {
  const diff = (Date.now() - new Date(v).getTime()) / 1000;
  if (diff < 60) return "только что";
  if (diff < 3600) return `${Math.floor(diff / 60)} мин назад`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ч назад`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} дн назад`;
  return formatDate(v);
}

onMounted(load);
</script>
