<template>
  <div
    ref="containerRef"
    class="relative h-screen w-full overflow-hidden bg-gray-950 font-sans"
    @mousemove="onMouseMove"
    @mouseleave="startHideControlsTimer"
  >
    <!-- PDF Canvas Container -->
    <div
      class="flex h-full w-full items-center justify-center transition-all duration-300 ease-out"
      :class="{ 'cursor-grab': !isPanning, 'cursor-grabbing': isPanning }"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="stopPan"
      @wheel.prevent="handleWheel"
    >
      <div
        class="relative transition-transform duration-75 ease-out"
        :style="{
          transform: `translate(${position.x}px, ${position.y}px)`,
        }"
      >
        <canvas
          ref="canvasRef"
          class="shadow-2xl transition-opacity duration-300"
          :class="{ 'opacity-50': loading }"
        />

        <!-- Loading Overlay -->
        <div
          v-if="loading"
          class="absolute inset-0 flex items-center justify-center rounded-lg bg-gray-900/10 backdrop-blur-sm"
        >
          <div
            class="h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"
          />
        </div>
      </div>
    </div>

    <!-- Toolbar (Controls) -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="showControls"
        class="absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-4 px-6 md:flex-row md:px-0"
        @mouseenter="stopHideControlsTimer"
      >
        <!-- Zoom Controls -->
        <div
          class="flex items-center gap-2 rounded-2xl bg-gray-900/80 p-2 text-white shadow-2xl backdrop-blur-md"
        >
          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            @click="zoomOut"
          >
            <IconsMinusIcon class="h-5 w-5" />
          </button>
          <span class="w-16 text-center text-sm font-medium"
            >{{ Math.round(scale * 100) }}%</span
          >
          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            @click="zoomIn"
          >
            <IconsPlusIcon class="h-5 w-5" />
          </button>
          <div class="mx-2 h-6 w-px bg-white/10" />
          <button
            class="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition hover:bg-white/10"
            @click="resetZoom"
          >
            <span>Сброс</span>
          </button>
        </div>

        <!-- Navigation Controls -->
        <div
          class="flex items-center gap-4 rounded-2xl bg-gray-900/80 p-2 text-white shadow-2xl backdrop-blur-md"
        >
          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10 disabled:opacity-30"
            :disabled="currentPage === 1"
            @click="prevPage"
          >
            <IconsChevronLeftIcon class="h-6 w-6" />
          </button>

          <div class="flex items-center gap-2">
            <input
              v-model.number="pageInput"
              type="number"
              class="w-16 rounded-lg bg-white/10 px-2 py-1 text-center font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              @keydown.enter="jumpToPage"
              @blur="jumpToPage"
            />
            <span class="text-gray-400">из</span>
            <span class="font-medium">{{ totalPages }}</span>
          </div>

          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10 disabled:opacity-30"
            :disabled="currentPage === totalPages"
            @click="nextPage"
          >
            <IconsChevronRightIcon class="h-6 w-6" />
          </button>

          <div class="mx-2 h-6 w-px bg-white/10" />

          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            title="Повернуть страницу"
            @click="rotate"
          >
            <IconsRotateCwIcon class="h-5 w-5" />
          </button>

          <div class="mx-2 h-6 w-px bg-white/10" />

          <button
            class="flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/10"
            @click="toggleFullscreen"
          >
            <IconsMaximizeIcon v-if="!isFullscreen" class="h-5 w-5" />
            <IconsMinimizeIcon v-else class="h-5 w-5" />
          </button>
        </div>
      </div>
    </Transition>

    <!-- Header Overlay -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="-translate-y-full opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="-translate-y-full opacity-0"
    >
      <div
        v-if="showControls"
        class="absolute left-0 top-0 flex w-full items-center justify-between bg-linear-to-b from-black/80 to-transparent p-6 text-white"
      >
        <div class="flex items-center gap-4">
          <button
            class="rounded-full bg-white/10 p-2 transition hover:bg-white/20"
            @click="router.back()"
          >
            <IconsArrowLeftIcon class="h-6 w-6" />
          </button>
          <div v-if="book">
            <h1 class="text-xl font-bold tracking-tight">{{ book.title }}</h1>
            <p v-if="book.author" class="text-sm text-gray-300 opacity-80">
              {{ book.author }}
            </p>
          </div>
        </div>

        <div class="hidden flex-col items-end gap-1 md:flex">
          <div class="text-xs uppercase tracking-widest text-gray-400">
            Прогресс
          </div>
          <div class="flex items-center gap-3">
            <div class="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
              <div
                class="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                :style="{ width: `${progressPercentage}%` }"
              />
            </div>
            <span class="text-sm font-bold tabular-nums"
              >{{ progressPercentage }}%</span
            >
          </div>
        </div>
      </div>
    </Transition>

    <!-- Fullscreen Loading -->
    <div
      v-if="loadingDoc"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 text-white"
    >
      <div class="relative h-24 w-24">
        <div
          class="absolute inset-0 animate-ping rounded-full bg-indigo-500/20"
        />
        <IconsBookOpenIcon class="relative h-24 w-24 text-indigo-500" />
      </div>
      <h2 class="mt-8 text-2xl font-medium">Открытие книги...</h2>
      <div class="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-900">
        <div
          class="h-full bg-indigo-500 transition-all duration-300"
          :style="{ width: `${downloadProgress}%` }"
        />
      </div>
    </div>

    <!-- Catchy Error State -->
    <div
      v-if="error"
      class="absolute inset-0 flex flex-col items-center justify-center bg-gray-950 p-6 text-center text-white"
    >
      <IconsAlertTriangleIcon class="h-16 w-16 text-rose-500" />
      <h2 class="mt-6 text-2xl font-bold">Упс! Что-то пошло не так</h2>
      <p class="mt-2 max-w-md text-gray-400">{{ error }}</p>
      <button
        class="mt-8 rounded-xl bg-white px-8 py-3 font-semibold text-gray-950 transition hover:bg-gray-200"
        @click="retryLoad"
      >
        Попробовать снова
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Просмотр книги — PDF-ридер (Senior Refactored)
 *
 * Исправлено: 100% отображение иконок через локальные компоненты Icons...
 */
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "~/composables/useToast";

definePageMeta({ layout: false as any });

interface Book {
  id: number;
  title: string;
  author: string | null;
  total_pages: number;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

const loadingDoc = ref(true);
const loading = ref(false);
const error = ref("");
const downloadProgress = ref(0);
const book = ref<Book | null>(null);
const currentPage = ref(1);
const pageInput = ref(1);
const sessionId = ref<number | null>(null);
const isFullscreen = ref(false);
const showControls = ref(true);
const pdfReady = ref(false);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const containerRef = ref<HTMLElement | null>(null);
let pdfDoc: any = null;
let currentRenderTask: any = null;

const scale = ref(1);
const rotation = ref(0);
const position = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const startPanPosition = ref({ x: 0, y: 0 });
const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

let hideControlsTimeout: ReturnType<typeof setTimeout>;

const totalPages = computed(() => book.value?.total_pages || 0);
const progressPercentage = computed(() => {
  if (!book.value) return 0;
  return Math.round((currentPage.value / book.value.total_pages) * 100);
});

const initPdfJs = async () => {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  return pdfjs;
};

const renderPage = async (pageNum: number) => {
  if (!pdfDoc || !pdfReady.value) return;
  if (currentRenderTask) {
    try {
      currentRenderTask.cancel();
    } catch {}
    currentRenderTask = null;
  }
  loading.value = true;
  try {
    const page = await pdfDoc.getPage(pageNum);
    const container = containerRef.value;
    if (!container) return;
    const naturalViewport = page.getViewport({
      scale: 1.0,
      rotation: rotation.value,
    });
    const availableW = container.clientWidth - 40;
    const availableH = container.clientHeight - 40;
    const baseFitScale = Math.min(
      availableW / naturalViewport.width,
      availableH / naturalViewport.height,
    );
    const pixelRatio = window.devicePixelRatio || 1;
    const supersampling = 1.25;
    const finalRenderScale =
      baseFitScale * scale.value * pixelRatio * supersampling;
    const viewport = page.getViewport({
      scale: finalRenderScale,
      rotation: rotation.value,
    });
    const canvas = canvasRef.value;
    if (!canvas) return;
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    canvas.style.width = `${Math.floor(viewport.width / (pixelRatio * supersampling))}px`;
    canvas.style.height = `${Math.floor(viewport.height / (pixelRatio * supersampling))}px`;
    const ctx = canvas.getContext("2d", { alpha: false })!;
    ctx.imageSmoothingEnabled = false;
    currentRenderTask = page.render({ canvasContext: ctx, viewport: viewport });
    await currentRenderTask.promise;
    scheduleProgressSave(pageNum);
  } catch (err: any) {
    if (err?.name !== "RenderingCancelledException")
      console.error("[PDF Render Error]", err);
  } finally {
    loading.value = false;
    currentRenderTask = null;
  }
};

const zoomIn = () => {
  if (scale.value < MAX_SCALE) {
    scale.value = Number((scale.value + 0.25).toFixed(2));
    renderPage(currentPage.value);
  }
};
const zoomOut = () => {
  if (scale.value > MIN_SCALE) {
    scale.value = Number((scale.value - 0.25).toFixed(2));
    renderPage(currentPage.value);
  }
};
const resetZoom = () => {
  scale.value = 1;
  rotation.value = 0;
  position.value = { x: 0, y: 0 };
  renderPage(currentPage.value);
};
const rotate = async () => {
  rotation.value = (rotation.value + 90) % 360;
  await renderPage(currentPage.value);
};
const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    if (e.deltaY < 0) zoomIn();
    else zoomOut();
  } else if (scale.value > 1) {
    position.value.y -= e.deltaY;
    position.value.x -= e.deltaX;
  }
};
const startPan = (e: MouseEvent) => {
  if (e.button !== 0) return;
  isPanning.value = true;
  startPanPosition.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  };
};
const pan = (e: MouseEvent) => {
  if (!isPanning.value) return;
  position.value = {
    x: e.clientX - startPanPosition.value.x,
    y: e.clientY - startPanPosition.value.y,
  };
};
const stopPan = () => {
  isPanning.value = false;
};
const nextPage = async () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    pageInput.value = currentPage.value;
    await renderPage(currentPage.value);
  }
};
const prevPage = async () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    pageInput.value = currentPage.value;
    await renderPage(currentPage.value);
  }
};
const jumpToPage = async () => {
  let page = Number(pageInput.value);
  if (isNaN(page) || page < 1) page = 1;
  if (page > totalPages.value) page = totalPages.value;
  currentPage.value = page;
  pageInput.value = page;
  await renderPage(page);
};

const onMouseMove = () => {
  showControls.value = true;
  startHideControlsTimer();
};
const startHideControlsTimer = () => {
  stopHideControlsTimer();
  hideControlsTimeout = setTimeout(() => {
    if (!isPanning.value) showControls.value = false;
  }, 3000);
};
const stopHideControlsTimer = () => {
  if (hideControlsTimeout) clearTimeout(hideControlsTimeout);
};
const toggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    isFullscreen.value = true;
  } else {
    document.exitFullscreen();
    isFullscreen.value = false;
  }
};
const retryLoad = async () => {
  pdfDoc = null;
  pdfReady.value = false;
  await loadDocument();
  if (pdfReady.value) await renderPage(currentPage.value);
};

onMounted(async () => {
  await startSession();
  await loadDocument();
  if (pdfReady.value) await renderPage(currentPage.value);
  startHideControlsTimer();
});
onUnmounted(() => {
  endSession();
  stopHideControlsTimer();
  if (currentRenderTask) currentRenderTask.cancel();
});
watch(currentPage, (val) => {
  pageInput.value = val;
});

let progressSaveTimeout: any = null;
const scheduleProgressSave = (pageNum: number) => {
  if (progressSaveTimeout) clearTimeout(progressSaveTimeout);
  progressSaveTimeout = setTimeout(async () => {
    try {
      await $fetch(`/api/library/reading/${route.params.id}/progress`, {
        method: "POST",
        body: { page: pageNum },
      });
    } catch (err) {}
  }, 2000);
};

const loadDocument = async () => {
  loadingDoc.value = true;
  try {
    const pdfjs = await initPdfJs();
    const response = await fetch(`/api/library/reading/${route.params.id}/raw`);
    const data = await response.arrayBuffer();
    pdfDoc = await pdfjs.getDocument({ data }).promise;
    pdfReady.value = true;
  } catch (err: any) {
    error.value =
      "Не удалось загрузить книгу: " + (err.message || "Ошибка сети");
  } finally {
    loadingDoc.value = false;
  }
};

const startSession = async () => {
  try {
    const res = await $fetch(`/api/library/reading/${route.params.id}/start`, {
      method: "POST",
    });
    book.value = (res as any).book;
    currentPage.value = (res as any).lastPage || 1;
    pageInput.value = currentPage.value;
  } catch (err) {}
};

const endSession = async () => {
  if (!book.value) return;
  await $fetch(`/api/library/reading/${route.params.id}/end`, {
    method: "POST",
  }).catch(() => {});
};
</script>

<style scoped>
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
