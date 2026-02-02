<template>
  <div class="fixed inset-0 bg-gray-900 flex flex-col">
    <!-- Верхняя панель -->
    <div
      class="flex items-center justify-between px-4 py-3 bg-gray-800 border-b border-gray-700 z-10"
      :class="{ 'opacity-0 pointer-events-none': isFullscreen }"
    >
      <div class="flex items-center gap-4">
        <button
          @click="goBack"
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          title="Назад к каталогу"
        >
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </button>
        <div class="min-w-0">
          <h1 class="text-white font-semibold truncate">{{ book?.title }}</h1>
          <p class="text-sm text-gray-400 truncate">{{ book?.author }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          @click="toggleFullscreen"
          class="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
          :title="
            isFullscreen
              ? 'Выйти из полноэкранного режима'
              : 'Полноэкранный режим'
          "
        >
          <svg
            v-if="!isFullscreen"
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          <svg
            v-else
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Область чтения -->
    <div
      class="flex-1 flex items-center justify-center overflow-hidden relative bg-gray-900"
      ref="containerRef"
      @wheel.prevent="handleWheel"
      @mousedown="startPan"
      @mousemove="pan"
      @mouseup="endPan"
      @mouseleave="endPan"
    >
      <!-- Загрузка -->
      <div
        v-if="loading"
        class="absolute inset-0 flex items-center justify-center z-20"
      >
        <div class="text-center bg-gray-800/80 p-6 rounded-xl backdrop-blur-sm">
          <div
            class="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"
          ></div>
          <p class="text-gray-400">Загрузка страницы...</p>
        </div>
      </div>

      <!-- Страница -->
      <div
        v-else-if="currentPageImage"
        class="relative flex items-center justify-center transition-transform duration-100 ease-out origin-center"
        :style="{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
          cursor: isPanning ? 'grabbing' : scale > 1 ? 'grab' : 'default',
        }"
      >
        <img
          :src="currentPageImage"
          draggable="false"
          :alt="`Страница ${currentPage}`"
          class="max-w-full max-h-[85vh] object-contain shadow-2xl select-none"
          :class="{ 'max-h-screen': isFullscreen }"
          @load="resetZoom"
        />
      </div>

      <!-- Ошибка -->
      <div
        v-else-if="error"
        class="absolute inset-0 flex items-center justify-center bg-gray-900 z-20"
      >
        <!-- ... код ошибки без изменений ... -->
        <div class="text-center max-w-md px-4">
          <svg
            class="mx-auto h-16 w-16 text-red-500 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 class="text-xl font-semibold text-white mb-2">Ошибка загрузки</h3>
          <p class="text-gray-400 mb-4">{{ error }}</p>
          <button
            @click="loadPage(currentPage)"
            class="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Повторить попытку
          </button>
        </div>
      </div>

      <!-- Кнопки зума и поворота -->
      <div
        v-if="!loading && currentPageImage"
        class="absolute bottom-6 right-6 flex flex-col gap-2 z-10"
      >
        <button
          @click="rotateLeft"
          class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors"
          title="Повернуть влево"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
            />
          </svg>
        </button>
        <button
          @click="rotateRight"
          class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors"
          title="Повернуть вправо"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 10H11a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
            />
          </svg>
        </button>

        <div class="h-px bg-gray-600 my-1"></div>

        <button
          @click="zoomIn"
          class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors"
          title="Увеличить"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
        <button
          @click="resetZoom"
          class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors text-sm font-bold w-10 h-10 flex items-center justify-center"
          title="Сбросить масштаб"
        >
          {{ Math.round(scale * 100) }}%
        </button>
        <button
          @click="zoomOut"
          class="p-2 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 backdrop-blur-sm shadow-lg transition-colors"
          title="Уменьшить"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20 12H4"
            />
          </svg>
        </button>
      </div>

      <!-- Навигация (стрелки) -->
      <div
        v-if="!loading && currentPageImage"
        class="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-between px-4 pointer-events-none z-10"
        :class="{ 'opacity-0': !showControls && !isFullscreen }"
      >
        <button
          @click.stop="previousPage"
          :disabled="currentPage <= 1"
          class="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all pointer-events-auto backdrop-blur-sm shadow-lg"
          title="Предыдущая страница"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          @click.stop="nextPage"
          :disabled="currentPage >= (book?.total_pages || 0)"
          class="p-3 bg-gray-800/80 text-white rounded-full hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all pointer-events-auto backdrop-blur-sm shadow-lg"
          title="Следующая страница"
        >
          <svg
            class="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>

    <!-- Нижняя панель управления -->
    <div
      v-if="!loading && book"
      class="px-4 py-3 bg-gray-800 border-t border-gray-700 z-10"
      :class="{
        'opacity-0 pointer-events-none': isFullscreen && !showControls,
      }"
    >
      <!-- Прогресс-бар -->
      <div class="mb-3">
        <div
          class="flex items-center justify-between text-sm text-gray-400 mb-2"
        >
          <span>Страница {{ currentPage }} из {{ book.total_pages }}</span>
          <span>{{ progressPercentage }}%</span>
        </div>
        <div class="relative">
          <input
            type="range"
            :min="1"
            :max="book.total_pages"
            v-model.number="currentPage"
            @change="handlePageChange"
            class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      <!-- Кнопки управления -->
      <div class="flex items-center justify-center gap-2">
        <button
          @click="previousPage"
          :disabled="currentPage <= 1"
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад
        </button>

        <div class="flex items-center gap-2 px-4">
          <input
            type="number"
            :min="1"
            :max="book.total_pages"
            v-model.number="pageInput"
            @keyup.enter="goToPage"
            class="w-20 px-3 py-2 bg-gray-700 text-white text-center rounded-lg border border-gray-600 focus:border-primary outline-none"
          />
          <button
            @click="goToPage"
            class="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Перейти
          </button>
        </div>

        <button
          @click="nextPage"
          :disabled="currentPage >= book.total_pages"
          class="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          Вперед
          <svg
            class="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useToast } from "~/composables/useToast";

definePageMeta({
  layout: false as any, // Полноэкранный режим
});

interface Book {
  id: number;
  title: string;
  author: string | null;
  total_pages: number;
}

const route = useRoute();
const router = useRouter();
const toast = useToast();

// Состояние
const loading = ref(true);
const error = ref("");
const book = ref<Book | null>(null);
const currentPage = ref(1);
const pageInput = ref(1);
const currentPageImage = ref("");
const sessionId = ref<number | null>(null);
const isFullscreen = ref(false);
const showControls = ref(true);

// Zoom & Pan state
const containerRef = ref<HTMLElement | null>(null);
const scale = ref(1);
const rotation = ref(0);
const position = ref({ x: 0, y: 0 });
const isPanning = ref(false);
const startPanPosition = ref({ x: 0, y: 0 });

let saveProgressTimeout: NodeJS.Timeout;
let hideControlsTimeout: NodeJS.Timeout;

// Zoom methods
const MIN_SCALE = 0.5;
const MAX_SCALE = 5; // Максимальное увеличение до 500%

const handleWheel = (e: WheelEvent) => {
  if (e.ctrlKey) {
    // Zoom
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    const newScale = Math.min(
      Math.max(MIN_SCALE, scale.value + delta),
      MAX_SCALE,
    );
    scale.value = Number(newScale.toFixed(2));
  } else {
    // Pan (если увеличено)
    if (scale.value > 1) {
      position.value.y -= e.deltaY;
      position.value.x -= e.deltaX;
    }
  }
};

const zoomIn = () => {
  scale.value = Math.min(MAX_SCALE, scale.value + 0.5);
};

const zoomOut = () => {
  scale.value = Math.max(MIN_SCALE, scale.value - 0.5);
};

const rotateLeft = () => {
  rotation.value -= 90;
};

const rotateRight = () => {
  rotation.value += 90;
};

const resetZoom = () => {
  scale.value = 1;
  rotation.value = 0;
  position.value = { x: 0, y: 0 };
};

// Pan methods
const startPan = (e: MouseEvent) => {
  if (scale.value > 1 || isFullscreen.value) {
    // Разрешаем двигать если увеличен или в фуллскрине
    isPanning.value = true;
    startPanPosition.value = {
      x: e.clientX - position.value.x,
      y: e.clientY - position.value.y,
    };
  }
};

const pan = (e: MouseEvent) => {
  if (!isPanning.value) return;

  position.value = {
    x: e.clientX - startPanPosition.value.x,
    y: e.clientY - startPanPosition.value.y,
  };
};

const endPan = () => {
  isPanning.value = false;
};

// Сброс зума при переключении страницы
watch(currentPage, () => {
  resetZoom();
});

// Computed
const progressPercentage = computed(() => {
  if (!book.value) return 0;
  return Math.round((currentPage.value / book.value.total_pages) * 100);
});

// Методы
const startSession = async () => {
  try {
    const response = await $fetch<{
      sessionId: number;
      book: Book;
      lastPage: number;
    }>(`/api/library/reading/${route.params.id}/start`, {
      method: "POST",
    });
    sessionId.value = response.sessionId;
    book.value = response.book;
    currentPage.value = response.lastPage || 1;
    pageInput.value = currentPage.value;
  } catch (error: any) {
    toast.error(error.data?.message || "Ошибка начала сессии чтения");
    router.push("/library");
  }
};

const loadPage = async (page: number) => {
  if (!book.value || page < 1 || page > book.value.total_pages) return;

  loading.value = true;
  error.value = "";

  try {
    // Получаем изображение страницы напрямую
    const response = await fetch(
      `/api/library/reading/${route.params.id}/page/${page}`,
      {
        headers: {
          Accept: "image/png",
        },
      },
    );

    if (!response.ok) {
      throw new Error("Ошибка загрузки страницы");
    }

    const blob = await response.blob();
    currentPageImage.value = URL.createObjectURL(blob);

    // Сохраняем прогресс с задержкой
    saveProgress(page);

    // Предзагрузка следующей страницы
    prefetchPage(page + 1);
  } catch (err: any) {
    error.value = err.message || "Не удалось загрузить страницу";
    currentPageImage.value = "";
  } finally {
    loading.value = false;
  }
};

const prefetchPage = (page: number) => {
  if (!book.value || page > book.value.total_pages) return;
  const img = new Image();
  img.src = `/api/library/reading/${route.params.id}/page/${page}`;
};

const saveProgress = (page: number) => {
  clearTimeout(saveProgressTimeout);
  saveProgressTimeout = setTimeout(async () => {
    try {
      await $fetch(`/api/library/reading/${route.params.id}/progress`, {
        method: "POST",
        body: {
          lastPageRead: page,
        },
      });
    } catch (error) {
      console.error("Ошибка сохранения прогресса:", error);
    }
  }, 1000);
};

const endSession = async () => {
  if (!sessionId.value) return;

  try {
    await $fetch(`/api/library/reading/${route.params.id}/end`, {
      method: "POST",
    });
  } catch (error) {
    console.error("Ошибка завершения сессии:", error);
  }
};

const previousPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
    pageInput.value = currentPage.value;
  }
};

const nextPage = () => {
  if (book.value && currentPage.value < book.value.total_pages) {
    currentPage.value++;
    pageInput.value = currentPage.value;
  }
};

const handlePageChange = () => {
  pageInput.value = currentPage.value;
  loadPage(currentPage.value);
};

const goToPage = () => {
  if (!book.value) return;

  const page = Math.max(1, Math.min(pageInput.value, book.value.total_pages));
  currentPage.value = page;
  pageInput.value = page;
  loadPage(page);
};

const goBack = async () => {
  await endSession();
  router.push("/library");
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

const toggleControls = () => {
  showControls.value = !showControls.value;

  if (showControls.value && isFullscreen.value) {
    clearTimeout(hideControlsTimeout);
    hideControlsTimeout = setTimeout(() => {
      showControls.value = false;
    }, 3000);
  }
};

// Обработка клавиатуры
const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === "ArrowLeft") {
    previousPage();
  } else if (e.key === "ArrowRight") {
    nextPage();
  } else if (e.key === "Escape" && isFullscreen.value) {
    toggleFullscreen();
  }
};

// Watchers
watch(currentPage, (newPage) => {
  loadPage(newPage);
});

// Lifecycle
onMounted(async () => {
  await startSession();
  if (book.value) {
    loadPage(currentPage.value);
  }
  window.addEventListener("keydown", handleKeyPress);

  // Обработка выхода из полноэкранного режима
  document.addEventListener("fullscreenchange", () => {
    isFullscreen.value = !!document.fullscreenElement;
  });
});

onUnmounted(async () => {
  await endSession();
  window.removeEventListener("keydown", handleKeyPress);
  clearTimeout(saveProgressTimeout);
  clearTimeout(hideControlsTimeout);

  // Освобождаем URL объекта
  if (currentPageImage.value) {
    URL.revokeObjectURL(currentPageImage.value);
  }
});
</script>

<style scoped>
/* Стилизация слайдера */
.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  transition: all 0.2s;
}

.slider::-webkit-slider-thumb:hover {
  background: #2563eb;
  transform: scale(1.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b82f6;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.slider::-moz-range-thumb:hover {
  background: #2563eb;
  transform: scale(1.2);
}

/* Скрываем стрелки у input[type="number"] */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
