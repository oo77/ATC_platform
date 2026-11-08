<template>
  <div
    ref="rootRef"
    class="reader fixed inset-0 flex flex-col overflow-hidden text-gray-100 select-none"
    :class="night ? 'bg-[#0b0d12]' : 'bg-[#1b1e24]'"
    @mousemove="revealControls"
    @touchstart.passive="revealControls"
  >
    <!-- Верхняя панель -->
    <header
      class="z-30 flex h-14 shrink-0 items-center gap-3 border-b border-white/5 bg-black/40 px-3 backdrop-blur-md transition-transform duration-300 sm:px-4"
      :class="controlsVisible ? 'translate-y-0' : '-translate-y-full'"
    >
      <button class="icon-btn" aria-label="Назад в библиотеку" title="Назад (Esc)" @click="goBack">
        <ArrowLeft class="h-5 w-5" />
      </button>
      <button
        class="icon-btn hidden sm:flex"
        :class="{ 'bg-white/10': sidebarOpen }"
        aria-label="Миниатюры страниц"
        title="Миниатюры (T)"
        :disabled="!ready"
        @click="sidebarOpen = !sidebarOpen"
      >
        <PanelLeft class="h-5 w-5" />
      </button>
      <div class="min-w-0 flex-1">
        <h1 class="truncate text-sm font-semibold leading-tight sm:text-base">{{ book?.title || "Загрузка…" }}</h1>
        <p v-if="book?.author" class="truncate text-xs text-gray-400">{{ book.author }}</p>
      </div>
      <div v-if="ready" class="hidden items-center gap-2 text-xs text-gray-400 md:flex">
        <span class="tabular-nums">{{ progressPct }}%</span>
        <div class="h-1 w-28 overflow-hidden rounded-full bg-white/10">
          <div class="h-full rounded-full bg-brand-400 transition-all duration-500" :style="{ width: `${progressPct}%` }" />
        </div>
      </div>
      <button class="icon-btn" :class="{ 'bg-white/10': night }" aria-label="Ночной режим" title="Ночной режим (N)" @click="toggleNight">
        <Moon class="h-5 w-5" />
      </button>
      <button class="icon-btn" aria-label="Во весь экран" title="Во весь экран (F)" @click="toggleFullscreen">
        <Minimize class="h-5 w-5" v-if="isFullscreen" />
        <Maximize class="h-5 w-5" v-else />
      </button>
    </header>

    <div class="relative flex min-h-0 flex-1">
      <!-- Миниатюры -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="-translate-x-full"
        leave-active-class="transition duration-150 ease-in"
        leave-to-class="-translate-x-full"
      >
        <aside
          v-if="sidebarOpen && ready"
          ref="thumbsRef"
          class="absolute inset-y-0 left-0 z-20 w-40 overflow-y-auto border-r border-white/5 bg-black/60 p-3 backdrop-blur-md sm:static sm:bg-black/30"
        >
          <button
            v-for="n in totalPages"
            :key="n"
            :data-page="n"
            class="thumb mb-3 block w-full rounded-md p-1 text-center transition-colors"
            :class="n === currentPage ? 'bg-brand-500/30 ring-1 ring-brand-400' : 'hover:bg-white/5'"
            @click="goTo(n)"
          >
            <div class="mx-auto flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-sm bg-white/5">
              <img v-if="thumbs[n]" :src="thumbs[n]" alt="" class="h-full w-full object-contain" :class="{ 'night-filter': night }" />
              <span v-else class="text-[10px] text-gray-500">…</span>
            </div>
            <span class="mt-1 block text-[11px] tabular-nums text-gray-400">{{ n }}</span>
          </button>
        </aside>
      </Transition>

      <!-- Страница -->
      <main
        ref="viewportRef"
        class="viewport relative min-w-0 flex-1 overflow-auto"
        :class="{ 'cursor-grab': canPan && !panning, 'cursor-grabbing': panning }"
        @wheel="onWheel"
        @mousedown="startPan"
        @touchstart.passive="onTouchStart"
        @touchend="onTouchEnd"
        @contextmenu.prevent
      >
        <div class="flex min-h-full min-w-full items-center justify-center p-4 sm:p-6">
          <div class="relative" :style="pageBoxStyle">
            <canvas
              ref="canvasRef"
              class="block rounded-sm bg-white shadow-2xl shadow-black/50 transition-opacity duration-150"
              :class="[{ 'night-filter': night }, rendering && !firstRenderDone ? 'opacity-0' : 'opacity-100']"
            />
            <div v-if="rendering && firstRenderDone" class="absolute right-2 top-2 h-4 w-4 animate-spin rounded-full border-2 border-brand-400 border-t-transparent" />
          </div>
        </div>

        <!-- Зоны листания по краям (клик) -->
        <template v-if="ready && !canPan">
          <button class="edge left-0" aria-label="Предыдущая страница" :disabled="currentPage <= 1" @click="prev" />
          <button class="edge right-0" aria-label="Следующая страница" :disabled="currentPage >= totalPages" @click="next" />
        </template>
      </main>
    </div>

    <!-- Нижняя панель -->
    <footer
      v-if="ready"
      class="z-30 shrink-0 border-t border-white/5 bg-black/40 px-3 pb-[max(env(safe-area-inset-bottom),0.5rem)] pt-2 backdrop-blur-md transition-transform duration-300 sm:px-4"
      :class="controlsVisible ? 'translate-y-0' : 'translate-y-full'"
    >
      <input
        type="range"
        min="1"
        :max="totalPages"
        :value="sliderPage"
        class="slider mb-2 w-full"
        aria-label="Перейти к странице"
        @input="sliderPage = Number(($event.target as HTMLInputElement).value)"
        @change="goTo(sliderPage)"
      />
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-1">
          <button class="icon-btn" :disabled="currentPage <= 1" aria-label="Предыдущая" title="Предыдущая (←)" @click="prev">
            <ChevronLeft class="h-5 w-5" />
          </button>
          <div class="flex items-center gap-1.5 text-sm">
            <input
              v-model.number="pageInput"
              type="number"
              min="1"
              :max="totalPages"
              class="h-8 w-14 rounded-md border border-white/10 bg-white/5 text-center tabular-nums focus:border-brand-400 focus:outline-none"
              aria-label="Номер страницы"
              @keydown.enter="($event.target as HTMLInputElement).blur()"
              @blur="goTo(pageInput)"
            />
            <span class="text-gray-400">из {{ totalPages }}</span>
          </div>
          <button class="icon-btn" :disabled="currentPage >= totalPages" aria-label="Следующая" title="Следующая (→)" @click="next">
            <ChevronRight class="h-5 w-5" />
          </button>
        </div>

        <div class="flex items-center gap-1">
          <div class="mr-1 hidden rounded-lg bg-white/5 p-0.5 sm:flex" role="group" aria-label="Масштаб по">
            <button class="seg" :class="{ active: fit === 'page' && zoom === 1 }" title="По странице" @click="setFit('page')">
              <Square class="h-4 w-4" />
            </button>
            <button class="seg" :class="{ active: fit === 'width' && zoom === 1 }" title="По ширине (W)" @click="setFit('width')">
              <MoveHorizontal class="h-4 w-4" />
            </button>
          </div>
          <button class="icon-btn" :disabled="zoom <= MIN_ZOOM" aria-label="Уменьшить" title="Уменьшить (−)" @click="zoomBy(-0.25)">
            <ZoomOut class="h-5 w-5" />
          </button>
          <button class="w-12 text-center text-xs tabular-nums text-gray-300 hover:text-white" title="Сбросить масштаб (0)" @click="resetView">
            {{ Math.round(zoom * 100) }}%
          </button>
          <button class="icon-btn" :disabled="zoom >= MAX_ZOOM" aria-label="Увеличить" title="Увеличить (+)" @click="zoomBy(0.25)">
            <ZoomIn class="h-5 w-5" />
          </button>
          <button class="icon-btn" aria-label="Повернуть" title="Повернуть (R)" @click="rotate">
            <RotateCw class="h-5 w-5" />
          </button>
          <button class="icon-btn hidden sm:flex" aria-label="Горячие клавиши" title="Горячие клавиши (?)" @click="showHelp = !showHelp">
            <Keyboard class="h-5 w-5" />
          </button>
        </div>
      </div>
    </footer>

    <!-- Подсказка по клавишам -->
    <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0 scale-95" leave-active-class="transition duration-100" leave-to-class="opacity-0">
      <div v-if="showHelp" class="absolute bottom-28 right-4 z-40 w-64 rounded-xl border border-white/10 bg-gray-900/95 p-4 text-xs shadow-2xl backdrop-blur" @click="showHelp = false">
        <p class="mb-2 text-sm font-semibold text-white">Горячие клавиши</p>
        <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-gray-300">
          <template v-for="h in hotkeys" :key="h[0]"><dt><kbd>{{ h[0] }}</kbd></dt><dd>{{ h[1] }}</dd></template>
        </dl>
      </div>
    </Transition>

    <!-- Загрузка документа -->
    <div v-if="phase === 'loading'" class="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-[#1b1e24]">
      <div class="relative">
        <div class="absolute inset-0 animate-ping rounded-full bg-brand-500/20" />
        <BookOpen class="relative h-14 w-14 text-brand-400" />
      </div>
      <div class="text-center">
        <p class="text-lg font-medium">{{ book?.title || "Открываем книгу" }}</p>
        <p class="mt-1 text-sm text-gray-400">{{ loadingText }}</p>
      </div>
      <div class="h-1 w-56 overflow-hidden rounded-full bg-white/10">
        <div
          class="h-full rounded-full bg-brand-400 transition-all duration-300"
          :class="{ 'animate-pulse': loadPct === null }"
          :style="{ width: `${loadPct ?? 35}%` }"
        />
      </div>
    </div>

    <!-- Ошибка / доступ отозван -->
    <div v-if="phase === 'error'" class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#1b1e24] p-6 text-center">
      <component :is="errorKind === 'access' ? ShieldOff : AlertTriangle" class="h-14 w-14" :class="errorKind === 'access' ? 'text-warning-400' : 'text-error-400'" />
      <h2 class="mt-5 text-xl font-semibold">{{ errorKind === "access" ? "Нет доступа к книге" : "Не удалось открыть книгу" }}</h2>
      <p class="mt-2 max-w-md text-sm text-gray-400">{{ errorText }}</p>
      <div class="mt-6 flex gap-3">
        <button class="rounded-lg border border-white/15 px-5 py-2.5 text-sm font-medium hover:bg-white/5" @click="goBack">В библиотеку</button>
        <button v-if="errorKind !== 'access'" class="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-200" @click="boot">
          Попробовать снова
        </button>
      </div>
    </div>

    <!-- Тост «продолжаем с N страницы» -->
    <Transition enter-active-class="transition duration-300" enter-from-class="opacity-0 translate-y-2" leave-active-class="transition duration-300" leave-to-class="opacity-0">
      <div v-if="resumeHint" class="pointer-events-none absolute left-1/2 top-20 z-40 -translate-x-1/2 rounded-full bg-black/70 px-4 py-2 text-sm backdrop-blur">
        {{ resumeHint }}
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
/**
 * Ридер книги (PDF).
 *
 * Оптимизации:
 * - файл грузится частями (HTTP Range): первая страница видна до скачивания всей книги;
 * - соседние страницы подгружаются заранее, повторный рендер отменяет устаревший;
 * - размер canvas ограничен (не падает на больших масштабах и HiDPI);
 * - heartbeat только когда вкладка видима — время чтения считается честно.
 *
 * Безопасность: файл доступен только по токену активной сессии; при отзыве
 * доступа сервер отвечает 403 на heartbeat и ридер закрывает книгу.
 */
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick, shallowRef } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft, PanelLeft, Moon, Maximize, Minimize, ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  RotateCw, Square, MoveHorizontal, Keyboard, BookOpen, AlertTriangle, ShieldOff,
} from "lucide-vue-next";
import { loadPdfjs } from "~/composables/usePdfjs";

definePageMeta({ layout: false as any });

interface ReaderBook {
  id: string;
  title: string;
  author: string | null;
  total_pages: number;
}

const route = useRoute();
const router = useRouter();
const bookId = String(route.params.id);


// ---------------- состояние ----------------
const rootRef = ref<HTMLElement | null>(null);
const viewportRef = ref<HTMLElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const thumbsRef = ref<HTMLElement | null>(null);

const phase = ref<"loading" | "ready" | "error">("loading");
const loadingText = ref("Подготовка…");
const loadPct = ref<number | null>(null);
const errorText = ref("");
const errorKind = ref<"access" | "other">("other");
const ready = computed(() => phase.value === "ready");

const book = ref<ReaderBook | null>(null);
const token = ref("");
const currentPage = ref(1);
const pageInput = ref(1);
const sliderPage = ref(1);
const totalPages = computed(() => pdfDoc.value?.numPages || book.value?.total_pages || 0);
const progressPct = computed(() => (totalPages.value ? Math.round((currentPage.value / totalPages.value) * 100) : 0));

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 4;
const fit = ref<"page" | "width">("page");
const zoom = ref(1);
const rotation = ref(0);
const night = ref(false);
const isFullscreen = ref(false);
const sidebarOpen = ref(false);
const showHelp = ref(false);
const controlsVisible = ref(true);
const rendering = ref(false);
const firstRenderDone = ref(false);
const resumeHint = ref("");
const pageBoxStyle = ref<Record<string, string>>({});
const thumbs = ref<Record<number, string>>({});

const pdfDoc = shallowRef<any>(null);
let loadingTask: any = null;
let renderTask: any = null;
let pendingRender = false;
let destroyed = false;

useHead({ title: computed(() => (book.value ? `${book.value.title} — Библиотека` : "Библиотека")) });

const hotkeys = [
  ["← →", "Листать страницы"],
  ["Home / End", "Первая / последняя"],
  ["+ / −", "Масштаб"],
  ["0", "Сбросить масштаб"],
  ["W", "По ширине / странице"],
  ["R", "Повернуть"],
  ["N", "Ночной режим"],
  ["T", "Миниатюры"],
  ["F", "Во весь экран"],
  ["Esc", "Назад"],
];

// ---------------- настройки ридера (на устройство) ----------------
const PREFS_KEY = "library:reader-prefs";
const loadPrefs = () => {
  try {
    const p = JSON.parse(localStorage.getItem(PREFS_KEY) || "{}");
    if (p.fit === "width" || p.fit === "page") fit.value = p.fit;
    night.value = !!p.night;
  } catch { /* приватный режим — не критично */ }
};
const savePrefs = () => {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ fit: fit.value, night: night.value }));
  } catch { /* не критично */ }
};

// ---------------- сессия ----------------
const api = (path: string) => `/api/library/reading/${bookId}${path}`;

const startSession = async () => {
  const res: any = await $fetch(api("/start"), { method: "POST" });
  book.value = res.book;
  token.value = res.token;
  return res as { lastPage: number };
};

const handleFatal = (err: any) => {
  const status = err?.statusCode || err?.status || err?.response?.status;
  errorKind.value = status === 403 ? "access" : "other";
  errorText.value =
    err?.data?.message ||
    (status === 403
      ? "Доступ к этой книге закрыт или истёк. Обратитесь к администратору библиотеки."
      : status === 404
        ? "Файл книги не найден на сервере. Сообщите администратору библиотеки."
        : status === 409
          ? "Сессия чтения истекла. Откройте книгу заново."
          : err?.name === "InvalidPDFException"
            ? "Файл книги повреждён. Сообщите администратору библиотеки."
            : "Проверьте подключение к интернету и попробуйте ещё раз.");
  phase.value = "error";
  teardownDoc();
};

// ---------------- загрузка документа ----------------
const openDocument = async (startPage: number) => {
  loadingText.value = "Загрузка документа…";
  const pdfjs = await loadPdfjs();
  teardownDoc();
  loadingTask = pdfjs.getDocument({
    url: `${api("/raw")}?token=${encodeURIComponent(token.value)}`,
    withCredentials: true,
    rangeChunkSize: 256 * 1024,
    disableAutoFetch: true, // не тянуть весь файл в фоне — только нужные страницы
    disableStream: true,
    isEvalSupported: false,
  });
  loadingTask.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
    if (total) loadPct.value = Math.min(100, Math.round((loaded / total) * 100));
  };
  const doc = await loadingTask.promise;
  if (destroyed) return doc.destroy();
  pdfDoc.value = doc;
  currentPage.value = Math.min(Math.max(startPage, 1), doc.numPages);
  pageInput.value = sliderPage.value = currentPage.value;
};

const boot = async () => {
  phase.value = "loading";
  loadPct.value = null;
  firstRenderDone.value = false;
  try {
    loadingText.value = "Проверка доступа…";
    const { lastPage } = await startSession();
    await openDocument(lastPage || 1);
    phase.value = "ready";
    await nextTick();
    await renderPage();
    if (currentPage.value > 1) {
      resumeHint.value = `Продолжаем со страницы ${currentPage.value}`;
      setTimeout(() => (resumeHint.value = ""), 2500);
    }
    startHeartbeat();
    revealControls();
  } catch (err: any) {
    handleFatal(err);
  }
};

const teardownDoc = () => {
  try { renderTask?.cancel(); } catch { /* ignore */ }
  renderTask = null;
  try { loadingTask?.destroy(); } catch { /* ignore */ }
  loadingTask = null;
  pdfDoc.value = null;
};

// ---------------- рендер ----------------
const MAX_CANVAS_PIXELS = 16_000_000;

const renderPage = async () => {
  const doc = pdfDoc.value;
  const canvas = canvasRef.value;
  const viewport = viewportRef.value;
  if (!doc || !canvas || !viewport) return;

  // Уже рендерим — отменяем и перерисуем актуальную страницу
  if (renderTask) {
    pendingRender = true;
    try { renderTask.cancel(); } catch { /* ignore */ }
    return;
  }

  rendering.value = true;
  const pageNum = currentPage.value;
  try {
    const page = await doc.getPage(pageNum);
    const base = page.getViewport({ scale: 1, rotation: rotation.value });
    const pad = window.innerWidth < 640 ? 32 : 48;
    const availW = Math.max(viewport.clientWidth - pad, 100);
    const availH = Math.max(viewport.clientHeight - pad, 100);
    const fitScale = fit.value === "width" ? availW / base.width : Math.min(availW / base.width, availH / base.height);
    const cssScale = fitScale * zoom.value;

    let dpr = Math.min(window.devicePixelRatio || 1, 3);
    const pixels = base.width * base.height * (cssScale * dpr) ** 2;
    if (pixels > MAX_CANVAS_PIXELS) dpr = Math.sqrt(MAX_CANVAS_PIXELS / (base.width * base.height)) / cssScale;

    const vp = page.getViewport({ scale: cssScale * dpr, rotation: rotation.value });
    const cssW = Math.floor(base.width * cssScale);
    const cssH = Math.floor(base.height * cssScale);

    // Рисуем во внеэкранный canvas и копируем — без мигания белым
    const off = document.createElement("canvas");
    off.width = Math.floor(vp.width);
    off.height = Math.floor(vp.height);
    const offCtx = off.getContext("2d", { alpha: false })!;
    renderTask = page.render({ canvasContext: offCtx, viewport: vp, canvas: off } as any);
    await renderTask.promise;

    if (pageNum === currentPage.value) {
      canvas.width = off.width;
      canvas.height = off.height;
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      canvas.getContext("2d", { alpha: false })!.drawImage(off, 0, 0);
      pageBoxStyle.value = { width: `${cssW}px`, height: `${cssH}px` };
      firstRenderDone.value = true;
    }
    prefetchAround(pageNum);
  } catch (err: any) {
    if (err?.name !== "RenderingCancelledException") console.error("[Reader] render error", err);
  } finally {
    renderTask = null;
    rendering.value = false;
    if (pendingRender) {
      pendingRender = false;
      renderPage();
    }
  }
};

/** Заранее подтягиваем данные соседних страниц — листание без ожидания */
const prefetchAround = (n: number) => {
  const doc = pdfDoc.value;
  if (!doc) return;
  for (const p of [n + 1, n + 2, n - 1]) {
    if (p >= 1 && p <= doc.numPages) doc.getPage(p).catch(() => {});
  }
};

// ---------------- навигация ----------------
const goTo = (n: number) => {
  if (!ready.value) return;
  const page = Math.min(Math.max(Math.round(Number(n) || 1), 1), totalPages.value);
  pageInput.value = sliderPage.value = page;
  if (page === currentPage.value) return;
  currentPage.value = page;
  viewportRef.value?.scrollTo({ top: 0 });
};
const next = () => goTo(currentPage.value + 1);
const prev = () => goTo(currentPage.value - 1);

watch(currentPage, () => {
  renderPage();
  scheduleSave();
  scrollThumbIntoView();
});

const setFit = (mode: "page" | "width") => {
  fit.value = mode;
  zoom.value = 1;
  savePrefs();
  renderPage();
};
const zoomBy = (delta: number) => {
  zoom.value = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Math.round((zoom.value + delta) * 100) / 100));
  renderPage();
};
const resetView = () => {
  zoom.value = 1;
  rotation.value = 0;
  renderPage();
};
const rotate = () => {
  rotation.value = (rotation.value + 90) % 360;
  renderPage();
};
const toggleNight = () => {
  night.value = !night.value;
  savePrefs();
};
const toggleFullscreen = async () => {
  try {
    if (!document.fullscreenElement) await rootRef.value?.requestFullscreen();
    else await document.exitFullscreen();
  } catch { /* браузер может запретить */ }
};
const onFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
};

const goBack = () => {
  if (window.history.length > 1) router.back();
  else router.push("/library");
};

// ---------------- мышь, колесо, жесты ----------------
const canPan = computed(() => {
  const v = viewportRef.value;
  return !!v && (zoom.value > 1 || fit.value === "width") && (v.scrollWidth > v.clientWidth || v.scrollHeight > v.clientHeight);
});
const panning = ref(false);
let panStart = { x: 0, y: 0, left: 0, top: 0 };
const startPan = (e: MouseEvent) => {
  if (e.button !== 0 || !canPan.value || !viewportRef.value) return;
  panning.value = true;
  panStart = { x: e.clientX, y: e.clientY, left: viewportRef.value.scrollLeft, top: viewportRef.value.scrollTop };
  window.addEventListener("mousemove", onPan);
  window.addEventListener("mouseup", stopPan, { once: true });
};
const onPan = (e: MouseEvent) => {
  const v = viewportRef.value;
  if (!panning.value || !v) return;
  v.scrollLeft = panStart.left - (e.clientX - panStart.x);
  v.scrollTop = panStart.top - (e.clientY - panStart.y);
};
const stopPan = () => {
  panning.value = false;
  window.removeEventListener("mousemove", onPan);
};

let wheelLock = 0;
const onWheel = (e: WheelEvent) => {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.1 : -0.1);
    return;
  }
  const v = viewportRef.value;
  if (!v || Date.now() < wheelLock) return;
  // Если страница помещается — колесо листает; иначе листаем у края прокрутки
  const atBottom = v.scrollTop + v.clientHeight >= v.scrollHeight - 2;
  const atTop = v.scrollTop <= 0;
  if (Math.abs(e.deltaY) < 20) return;
  if (e.deltaY > 0 && atBottom && currentPage.value < totalPages.value) {
    wheelLock = Date.now() + 350;
    next();
  } else if (e.deltaY < 0 && atTop && currentPage.value > 1) {
    wheelLock = Date.now() + 350;
    prev();
    nextTick(() => {
      // на предыдущей странице встаём в её конец
      requestAnimationFrame(() => viewportRef.value?.scrollTo({ top: viewportRef.value.scrollHeight }));
    });
  }
};

let touch = { x: 0, y: 0, t: 0 };
const onTouchStart = (e: TouchEvent) => {
  const t = e.touches[0];
  if (e.touches.length !== 1 || !t) return;
  touch = { x: t.clientX, y: t.clientY, t: Date.now() };
};
const onTouchEnd = (e: TouchEvent) => {
  const t = e.changedTouches[0];
  if (canPan.value || !t) return;
  const dx = t.clientX - touch.x;
  const dy = t.clientY - touch.y;
  if (Date.now() - touch.t < 600 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0) next();
    else prev();
  }
};

// ---------------- клавиатура ----------------
const onKey = (e: KeyboardEvent) => {
  if (!ready.value) return;
  const target = e.target as HTMLElement;
  if (target?.tagName === "INPUT" && (target as HTMLInputElement).type === "number") return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const k = e.key;
  const handled = (() => {
    switch (k) {
      case "ArrowRight": case "PageDown": case " ": next(); return true;
      case "ArrowLeft": case "PageUp": prev(); return true;
      case "Home": goTo(1); return true;
      case "End": goTo(totalPages.value); return true;
      case "+": case "=": zoomBy(0.25); return true;
      case "-": case "_": zoomBy(-0.25); return true;
      case "0": resetView(); return true;
      case "w": case "W": case "ц": case "Ц": setFit(fit.value === "width" ? "page" : "width"); return true;
      case "r": case "R": case "к": case "К": rotate(); return true;
      case "n": case "N": case "т": case "Т": toggleNight(); return true;
      case "t": case "T": case "е": case "Е": sidebarOpen.value = !sidebarOpen.value; return true;
      case "f": case "F": case "а": case "А": toggleFullscreen(); return true;
      case "?": showHelp.value = !showHelp.value; return true;
      case "Escape":
        if (showHelp.value) showHelp.value = false;
        else if (!document.fullscreenElement) goBack();
        return true;
    }
    return false;
  })();
  if (handled) {
    e.preventDefault();
    revealControls();
  }
};

// ---------------- автоскрытие панелей ----------------
let hideTimer: ReturnType<typeof setTimeout> | undefined;
const revealControls = () => {
  controlsVisible.value = true;
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => {
    if (!panning.value && !showHelp.value && ready.value) controlsVisible.value = false;
  }, 3500);
};

// ---------------- миниатюры ----------------
let thumbObserver: IntersectionObserver | null = null;
const thumbQueue = new Set<number>();
let thumbBusy = false;

const renderThumbs = async () => {
  if (thumbBusy) return;
  thumbBusy = true;
  try {
    while (thumbQueue.size && pdfDoc.value && sidebarOpen.value) {
      const n = thumbQueue.values().next().value as number;
      thumbQueue.delete(n);
      if (thumbs.value[n]) continue;
      const page = await pdfDoc.value.getPage(n);
      const base = page.getViewport({ scale: 1 });
      const vp = page.getViewport({ scale: 220 / base.width });
      const c = document.createElement("canvas");
      c.width = Math.floor(vp.width);
      c.height = Math.floor(vp.height);
      await page.render({ canvasContext: c.getContext("2d", { alpha: false })!, viewport: vp, canvas: c } as any).promise;
      thumbs.value = { ...thumbs.value, [n]: c.toDataURL("image/jpeg", 0.7) };
    }
  } catch { /* документ закрыт — не критично */ }
  finally {
    thumbBusy = false;
  }
};

watch(sidebarOpen, async (open) => {
  thumbObserver?.disconnect();
  if (!open) return;
  await nextTick();
  const root = thumbsRef.value;
  if (!root) return;
  thumbObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) if (e.isIntersecting) thumbQueue.add(Number((e.target as HTMLElement).dataset.page));
      renderThumbs();
    },
    { root, rootMargin: "300px" },
  );
  root.querySelectorAll(".thumb").forEach((el) => thumbObserver!.observe(el));
  scrollThumbIntoView();
  renderPage(); // ширина области изменилась
});

const scrollThumbIntoView = () => {
  if (!sidebarOpen.value) return;
  nextTick(() => {
    thumbsRef.value?.querySelector(`[data-page="${currentPage.value}"]`)?.scrollIntoView({ block: "nearest" });
  });
};

// ---------------- прогресс и heartbeat ----------------
const HEARTBEAT_MS = 30_000;
let heartbeatTimer: ReturnType<typeof setInterval> | undefined;
let saveTimer: ReturnType<typeof setTimeout> | undefined;
let recovering = false;

const sendProgress = async () => {
  if (!token.value || !ready.value) return;
  try {
    await $fetch(api("/progress"), {
      method: "POST",
      body: { token: token.value, page: currentPage.value, visible: document.visibilityState === "visible" },
    });
  } catch (err: any) {
    const status = err?.statusCode || err?.status || err?.response?.status;
    if (status === 403 || status === 404) return handleFatal(err);
    if (status === 409 && !recovering) {
      // Сессия истекла (вкладка долго была скрыта) — тихо открываем новую
      recovering = true;
      try {
        await startSession();
        await openDocument(currentPage.value);
        await renderPage();
      } catch (e) {
        handleFatal(e);
      } finally {
        recovering = false;
      }
    }
  }
};

const scheduleSave = () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(sendProgress, 1500);
};

const startHeartbeat = () => {
  clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    if (document.visibilityState === "visible") sendProgress();
  }, HEARTBEAT_MS);
};

const onVisibility = () => {
  if (document.visibilityState === "hidden") sendProgress();
};

const endSession = () => {
  if (!token.value) return;
  const payload = JSON.stringify({ token: token.value, page: currentPage.value });
  token.value = "";
  // sendBeacon переживает закрытие вкладки, в отличие от fetch
  const sent = navigator.sendBeacon?.(api("/end"), new Blob([payload], { type: "application/json" }));
  if (!sent) {
    fetch(api("/end"), { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
};

// ---------------- жизненный цикл ----------------
let resizeObserver: ResizeObserver | null = null;
let resizeTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  loadPrefs();
  boot();
  window.addEventListener("keydown", onKey);
  window.addEventListener("pagehide", endSession);
  document.addEventListener("visibilitychange", onVisibility);
  document.addEventListener("fullscreenchange", onFullscreenChange);
  resizeObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => ready.value && renderPage(), 120);
  });
  if (viewportRef.value) resizeObserver.observe(viewportRef.value);
});

onBeforeUnmount(() => {
  destroyed = true;
  clearTimeout(saveTimer);
  clearTimeout(hideTimer);
  clearInterval(heartbeatTimer);
  window.removeEventListener("keydown", onKey);
  window.removeEventListener("pagehide", endSession);
  document.removeEventListener("visibilitychange", onVisibility);
  document.removeEventListener("fullscreenchange", onFullscreenChange);
  resizeObserver?.disconnect();
  thumbObserver?.disconnect();
  endSession();
  teardownDoc();
});
</script>

<style scoped>
.icon-btn {
  display: flex;
  height: 2.25rem;
  width: 2.25rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  color: rgb(229 231 235);
  transition: background-color 0.15s;
}
.icon-btn:hover:not(:disabled) {
  background: rgb(255 255 255 / 0.1);
}
.icon-btn:disabled {
  opacity: 0.3;
}
.seg {
  display: flex;
  height: 1.75rem;
  width: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  color: rgb(156 163 175);
}
.seg.active {
  background: rgb(255 255 255 / 0.12);
  color: white;
}
.edge {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 12%;
  max-width: 120px;
  cursor: pointer;
}
.edge:disabled {
  cursor: default;
}
.night-filter {
  filter: invert(0.92) hue-rotate(180deg) brightness(0.95);
}
.slider {
  height: 4px;
  appearance: none;
  border-radius: 9999px;
  background: rgb(255 255 255 / 0.12);
  accent-color: var(--color-brand-400);
}
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 14px;
  width: 14px;
  border-radius: 9999px;
  background: var(--color-brand-400);
  cursor: pointer;
}
kbd {
  border-radius: 0.25rem;
  background: rgb(255 255 255 / 0.1);
  padding: 0.05rem 0.35rem;
  font-family: inherit;
  font-size: 11px;
  color: white;
}
input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}
.viewport {
  scrollbar-color: rgb(255 255 255 / 0.15) transparent;
}
</style>
