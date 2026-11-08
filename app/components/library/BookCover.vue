<template>
  <!--
    Обложка книги: первая страница PDF рендерится лениво, когда карточка
    попадает в экран. Пока обложки нет — «переплёт» с цветом от названия.
  -->
  <div
    ref="rootRef"
    class="relative overflow-hidden rounded-md bg-gray-100 shadow-sm ring-1 ring-black/5 dark:bg-gray-800 dark:ring-white/10"
    :class="aspect ? 'aspect-[3/4]' : ''"
  >
    <img
      v-if="src"
      :src="src"
      :alt="`Обложка: ${title}`"
      class="absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-300"
      :class="loaded ? 'opacity-100' : 'opacity-0'"
      draggable="false"
      @load="loaded = true"
    />
    <div
      v-if="!src || !loaded"
      class="absolute inset-0 flex flex-col justify-between p-[12%] text-white"
      :style="{ background: placeholderBg }"
    >
      <span class="absolute inset-y-0 left-[6%] w-px bg-white/25" aria-hidden="true" />
      <span
        class="line-clamp-4 pl-[6%] font-semibold leading-tight"
        :class="compact ? 'text-[9px]' : 'text-sm'"
      >{{ title }}</span>
      <span v-if="author && !compact" class="line-clamp-2 pl-[6%] text-[11px] text-white/80">{{ author }}</span>
    </div>
    <slot />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watch } from "vue";
import { getCoverImage } from "~/composables/usePdfjs";

const props = withDefaults(
  defineProps<{
    url: string | null;
    title: string;
    author?: string | null;
    /** Ширина рендера в CSS-пикселях */
    width?: number;
    /** Сохранять пропорции 3:4 (иначе размер задаёт родитель) */
    aspect?: boolean;
    /** Маленькая обложка (в таблицах) — мельче текст заглушки */
    compact?: boolean;
  }>(),
  { author: null, width: 240, aspect: true, compact: false },
);

const rootRef = ref<HTMLElement | null>(null);
const src = ref<string | null>(null);
const loaded = ref(false);
let observer: IntersectionObserver | null = null;

// Стабильный цвет «переплёта» от названия
const placeholderBg = computed(() => {
  let h = 0;
  for (const ch of props.title || "") h = (h * 31 + ch.charCodeAt(0)) % 360;
  return `linear-gradient(145deg, hsl(${h} 45% 42%), hsl(${(h + 35) % 360} 50% 28%))`;
});

const load = async () => {
  if (!props.url) return;
  const url = await getCoverImage(props.url, props.width);
  src.value = url;
};

onMounted(() => {
  if (!props.url || !rootRef.value) return;
  observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        observer?.disconnect();
        load();
      }
    },
    { rootMargin: "200px" },
  );
  observer.observe(rootRef.value);
});

watch(
  () => props.url,
  () => {
    loaded.value = false;
    src.value = null;
    load();
  },
);

onBeforeUnmount(() => observer?.disconnect());
</script>
