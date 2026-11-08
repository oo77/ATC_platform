<template>
  <div ref="screen" class="pd-page" :class="{ 'pd-page--idle': idle && isFullscreen }" @mousemove="poke" @touchstart.passive="poke">
    <!-- Загрузка -->
    <div v-if="state === 'loading'" class="pd-center">
      <div class="pd-spinner" />
      <p class="mt-4 text-sm text-slate-400">Загрузка дашборда…</p>
    </div>

    <!-- Пароль -->
    <div v-else-if="state === 'password'" class="pd-center px-4">
      <form class="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-100" @submit.prevent="submitPassword">
        <div class="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
          <Lock class="h-5 w-5" />
        </div>
        <h1 class="text-lg font-semibold">{{ lockedTitle || "Дашборд защищён" }}</h1>
        <p class="mt-1 text-sm text-slate-400">Введите пароль, чтобы открыть дашборд.</p>
        <input
          v-model="passwordInput"
          type="password"
          autocomplete="current-password"
          autofocus
          class="mt-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
          placeholder="Пароль"
        />
        <label class="mt-3 flex items-center gap-2 text-sm text-slate-400">
          <input v-model="rememberPassword" type="checkbox" class="rounded border-slate-600 bg-slate-900" />
          Запомнить на этом устройстве
        </label>
        <p v-if="passwordError" class="mt-3 text-sm text-red-400">{{ passwordError }}</p>
        <button
          type="submit"
          :disabled="!passwordInput || checking"
          class="mt-5 w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-500 disabled:opacity-50"
        >
          {{ checking ? "Проверка…" : "Открыть" }}
        </button>
      </form>
    </div>

    <!-- Ошибка -->
    <div v-else-if="state === 'error'" class="pd-center px-4 text-center">
      <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800 text-slate-300">
        <MonitorOff class="h-6 w-6" />
      </div>
      <h1 class="text-lg font-semibold text-slate-100">{{ errorTitle }}</h1>
      <p class="mt-1 max-w-sm text-sm text-slate-400">{{ errorMessage }}</p>
      <button
        v-if="errorRetryable"
        class="mt-5 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800"
        @click="load(true)"
      >
        Повторить
      </button>
    </div>

    <!-- Дашборд -->
    <DashboardView
      v-else-if="dashboard"
      :title="dashboard.title"
      :description="dashboard.description"
      :widgets="dashboard.widgets"
      :settings="dashboard.settings"
      :data="data"
      :generated-at="generatedAt"
      :loading="refreshing"
      :fill="dashboard.settings.fitToScreen && !isNarrow"
    >
      <template v-if="!kiosk" #actions>
        <div class="pd-controls flex items-center gap-1.5">
          <span v-if="staleWarning" class="pd-stale" :title="staleWarning">
            <WifiOff class="h-4 w-4" />
          </span>
          <button class="pd-ctl" title="Обновить сейчас" aria-label="Обновить сейчас" @click="load(false)">
            <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': refreshing }" />
          </button>
          <button
            v-if="dashboard.settings.allowFullscreen && fullscreenSupported"
            class="pd-ctl"
            :title="isFullscreen ? 'Выйти из полноэкранного режима (Esc)' : 'На весь экран (F)'"
            :aria-label="isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'"
            @click="toggleFullscreen"
          >
            <Minimize v-if="isFullscreen" class="h-4 w-4" />
            <Maximize v-else class="h-4 w-4" />
          </button>
        </div>
      </template>
    </DashboardView>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { Lock, Maximize, Minimize, MonitorOff, RefreshCw, WifiOff } from "lucide-vue-next";
import DashboardView from "~/components/public-dashboard/DashboardView.vue";
import type { DashboardSettings, DashboardWidget, WidgetData } from "../../../shared/utils/publicDashboard";

definePageMeta({ layout: false });

const route = useRoute();
const token = computed(() => String(route.params.token || ""));
/** ?kiosk=1 — без кнопок управления (для ТВ/киоска) */
const kiosk = computed(() => route.query.kiosk === "1");

type State = "loading" | "password" | "error" | "ready";

const state = ref<State>("loading");
const dashboard = ref<{
  title: string;
  description: string | null;
  widgets: DashboardWidget[];
  settings: DashboardSettings;
} | null>(null);
const data = ref<Record<string, WidgetData>>({});
const generatedAt = ref<string | null>(null);
const refreshing = ref(false);
const staleWarning = ref("");

useHead({
  title: () => dashboard.value?.title || "Дашборд",
  meta: [{ name: "robots", content: "noindex, nofollow" }],
});

const errorTitle = ref("");
const errorMessage = ref("");
const errorRetryable = ref(false);

// ── Пароль ──
const storageKey = computed(() => `pd-pass:${token.value}`);
const password = ref("");
const passwordInput = ref("");
const rememberPassword = ref(true);
const passwordError = ref("");
const lockedTitle = ref("");
const checking = ref(false);

function readStoredPassword(): string {
  try {
    return sessionStorage.getItem(storageKey.value) || localStorage.getItem(storageKey.value) || "";
  } catch {
    return "";
  }
}
function storePassword(value: string, remember: boolean) {
  try {
    sessionStorage.setItem(storageKey.value, value);
    if (remember) localStorage.setItem(storageKey.value, value);
    else localStorage.removeItem(storageKey.value);
  } catch {
    /* хранилище недоступно — пароль останется только в памяти */
  }
}
function forgetPassword() {
  try {
    sessionStorage.removeItem(storageKey.value);
    localStorage.removeItem(storageKey.value);
  } catch {}
}

// ── Загрузка ──
let refreshTimer: ReturnType<typeof setTimeout> | undefined;
let firstView = true;

function scheduleRefresh(retrySoon = false) {
  clearTimeout(refreshTimer);
  if (!dashboard.value) return;
  const sec = retrySoon ? Math.min(30, dashboard.value.settings.refreshInterval) : dashboard.value.settings.refreshInterval;
  refreshTimer = setTimeout(() => load(false), sec * 1000);
}

async function load(initial: boolean) {
  if (initial) state.value = dashboard.value ? state.value : "loading";
  refreshing.value = true;
  try {
    const res: any = await $fetch(`/api/public-dashboard/${encodeURIComponent(token.value)}`, {
      query: firstView ? { view: "1" } : undefined,
      headers: password.value ? { "X-Dashboard-Password": encodeURIComponent(password.value) } : undefined,
    });
    firstView = false;
    dashboard.value = res.dashboard;
    data.value = res.data || {};
    generatedAt.value = res.generatedAt;
    staleWarning.value = "";
    state.value = "ready";
    scheduleRefresh();
  } catch (e: any) {
    const status = e?.statusCode || e?.response?.status;
    const body = e?.data || e?.response?._data;
    if (status === 401 && body?.data?.needPassword) {
      lockedTitle.value = body.data.title || "";
      if (password.value) {
        passwordError.value = "Неверный пароль";
        forgetPassword();
      }
      password.value = "";
      dashboard.value = null;
      state.value = "password";
      clearTimeout(refreshTimer);
    } else if (dashboard.value && status !== 404 && status !== 410) {
      // Сеть/сервер временно недоступны — оставляем старые данные
      staleWarning.value = "Нет связи с сервером, показаны последние данные";
      scheduleRefresh(true);
    } else {
      errorRetryable.value = !status || status >= 500 || status === 429;
      errorTitle.value =
        status === 404 ? "Дашборд не найден" : status === 410 ? "Ссылка больше не действует" : "Не удалось загрузить дашборд";
      errorMessage.value =
        body?.message ||
        (status === 404 ? "Ссылка неверна или была отключена." : "Проверьте подключение и попробуйте ещё раз.");
      dashboard.value = null;
      state.value = "error";
      clearTimeout(refreshTimer);
      if (errorRetryable.value) refreshTimer = setTimeout(() => load(true), 60_000);
    }
  } finally {
    refreshing.value = false;
    checking.value = false;
  }
}

async function submitPassword() {
  if (!passwordInput.value) return;
  checking.value = true;
  passwordError.value = "";
  password.value = passwordInput.value;
  storePassword(passwordInput.value, rememberPassword.value);
  await load(true);
  if (state.value === "ready") passwordInput.value = "";
}

// ── Полноэкранный режим ──
const screen = ref<HTMLElement | null>(null);
const isFullscreen = ref(false);
const fullscreenSupported = ref(false);
let wakeLock: any = null;

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await (screen.value || document.documentElement).requestFullscreen();
  } catch (e) {
    console.warn("Fullscreen недоступен:", e);
  }
}

async function syncWakeLock() {
  // Не даём экрану погаснуть, пока дашборд открыт на весь экран
  try {
    if (isFullscreen.value && document.visibilityState === "visible" && "wakeLock" in navigator) {
      if (!wakeLock) wakeLock = await (navigator as any).wakeLock.request("screen");
    } else if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    wakeLock = null;
  }
}

function onFullscreenChange() {
  isFullscreen.value = !!document.fullscreenElement;
  poke();
  syncWakeLock();
}

// Скрываем курсор и кнопки при бездействии в полноэкранном режиме
const idle = ref(false);
let idleTimer: ReturnType<typeof setTimeout> | undefined;
function poke() {
  idle.value = false;
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => (idle.value = true), 3000);
}

function onKey(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
  if ((e.key === "f" || e.key === "F" || e.key === "а" || e.key === "А") && !e.ctrlKey && !e.metaKey) {
    if (dashboard.value?.settings.allowFullscreen) toggleFullscreen();
  } else if (e.key === "r" || e.key === "R" || e.key === "к" || e.key === "К") {
    if (!e.ctrlKey && !e.metaKey && state.value === "ready") load(false);
  }
}

function onVisibility() {
  syncWakeLock();
  // Вкладка снова видна — обновляем, если данные устарели
  if (document.visibilityState === "visible" && dashboard.value && generatedAt.value) {
    const age = (Date.now() - new Date(generatedAt.value).getTime()) / 1000;
    if (age > dashboard.value.settings.refreshInterval) load(false);
  }
}

// Узкие экраны: режим «растянуть на экран» отключаем, иначе карточки сплющиваются
const isNarrow = ref(false);
const onResize = () => (isNarrow.value = window.innerWidth < 760);

onMounted(() => {
  fullscreenSupported.value = !!document.documentElement.requestFullscreen;
  onResize();
  password.value = readStoredPassword();
  document.addEventListener("fullscreenchange", onFullscreenChange);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("keydown", onKey);
  window.addEventListener("resize", onResize);
  load(true);
});

onBeforeUnmount(() => {
  clearTimeout(refreshTimer);
  clearTimeout(idleTimer);
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  document.removeEventListener("visibilitychange", onVisibility);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("resize", onResize);
  wakeLock?.release?.().catch?.(() => {});
});
</script>

<style scoped>
.pd-page {
  min-height: 100vh;
  height: 100vh;
  overflow: auto;
  background: #0b1120;
}
.pd-page:fullscreen {
  overflow: auto;
}
.pd-page--idle,
.pd-page--idle :deep(*) {
  cursor: none !important;
}
.pd-page--idle :deep(.pd-controls) {
  opacity: 0;
  pointer-events: none;
}
.pd-center {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.pd-spinner {
  width: 36px;
  height: 36px;
  border-radius: 9999px;
  border: 3px solid #1e293b;
  border-top-color: #6366f1;
  animation: spin 0.9s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
:deep(.pd-controls) {
  transition: opacity 0.3s;
}
:deep(.pd-ctl) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: 1px solid var(--pd-border);
  background: var(--pd-card);
  color: var(--pd-muted);
  transition: color 0.15s, border-color 0.15s;
}
:deep(.pd-ctl:hover) {
  color: var(--pd-text);
  border-color: var(--pd-accent);
}
:deep(.pd-ctl:focus-visible) {
  outline: 2px solid var(--pd-accent);
  outline-offset: 2px;
}
:deep(.pd-stale) {
  display: inline-flex;
  color: #f59e0b;
  padding: 0 4px;
}
</style>
