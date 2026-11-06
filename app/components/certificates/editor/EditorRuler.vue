<template>
  <canvas ref="canvasRef" class="editor-ruler" :class="orientation" />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  orientation: "horizontal" | "vertical";
  zoom: number;
  /** Положение начала холста (0 px шаблона) относительно начала линейки, в экранных px */
  origin: number;
  /** Размер холста по этой оси, px шаблона — подсвечивается на линейке */
  canvasSize: number;
  /** Позиция курсора в px шаблона (null — курсор вне холста) */
  cursor: number | null;
  /** Подсвеченный диапазон (выделенные элементы), px шаблона */
  highlight?: { start: number; end: number } | null;
}>();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const RULER_SIZE = 20;
let resizeObserver: ResizeObserver | null = null;
let frame = 0;

// Шаг подписей подбирается так, чтобы между ними было не меньше ~60 экранных px
const STEPS = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000];

function pickStep(zoom: number) {
  return STEPS.find((s) => s * zoom >= 60) ?? STEPS[STEPS.length - 1]!;
}

function draw() {
  frame = 0;
  const canvas = canvasRef.value;
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const horizontal = props.orientation === "horizontal";
  const length = horizontal ? rect.width : rect.height;
  if (length <= 0) return;

  const w = Math.round(rect.width * dpr);
  const h = Math.round(rect.height * dpr);
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const dark = document.documentElement.classList.contains("dark");
  const colors = dark
    ? { bg: "#1f2937", page: "#374151", tick: "#6b7280", text: "#9ca3af", sel: "rgba(59,130,246,0.35)" }
    : { bg: "#f9fafb", page: "#ffffff", tick: "#9ca3af", text: "#6b7280", sel: "rgba(59,130,246,0.2)" };

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, rect.width, rect.height);

  const toScreen = (v: number) => props.origin + v * props.zoom;

  // Область холста
  const pageStart = Math.max(0, toScreen(0));
  const pageEnd = Math.min(length, toScreen(props.canvasSize));
  if (pageEnd > pageStart) {
    ctx.fillStyle = colors.page;
    if (horizontal) ctx.fillRect(pageStart, 0, pageEnd - pageStart, RULER_SIZE);
    else ctx.fillRect(0, pageStart, RULER_SIZE, pageEnd - pageStart);
  }

  // Выделенные элементы
  if (props.highlight) {
    const a = toScreen(props.highlight.start);
    const b = toScreen(props.highlight.end);
    ctx.fillStyle = colors.sel;
    if (horizontal) ctx.fillRect(a, 0, b - a, RULER_SIZE);
    else ctx.fillRect(0, a, RULER_SIZE, b - a);
  }

  // Деления
  const step = pickStep(props.zoom);
  const minorCount = step * props.zoom >= 100 ? 10 : 5;
  const minor = step / minorCount;
  const first = Math.floor(-props.origin / props.zoom / minor) * minor;
  const last = (length - props.origin) / props.zoom;

  ctx.strokeStyle = colors.tick;
  ctx.fillStyle = colors.text;
  ctx.lineWidth = 1;
  ctx.font = "10px system-ui, sans-serif";
  ctx.textBaseline = "top";
  ctx.beginPath();
  for (let v = first; v <= last; v += minor) {
    const value = Math.round(v * 1000) / 1000;
    const pos = Math.round(toScreen(value)) + 0.5;
    const isMajor = Math.abs(value / step - Math.round(value / step)) < 1e-6;
    const isHalf =
      !isMajor &&
      minorCount === 10 &&
      Math.abs((value * 2) / step - Math.round((value * 2) / step)) < 1e-6;
    const tick = isMajor ? RULER_SIZE : isHalf ? 8 : 4;
    if (horizontal) {
      ctx.moveTo(pos, RULER_SIZE - tick);
      ctx.lineTo(pos, RULER_SIZE);
    } else {
      ctx.moveTo(RULER_SIZE - tick, pos);
      ctx.lineTo(RULER_SIZE, pos);
    }
    if (isMajor) {
      const label = String(Math.round(value));
      if (horizontal) {
        ctx.fillText(label, pos + 3, 2);
      } else {
        ctx.save();
        ctx.translate(2, pos + 3);
        ctx.rotate(Math.PI / 2);
        ctx.translate(0, -10);
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    }
  }
  ctx.stroke();

  // Нижняя/правая граница линейки
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(0, RULER_SIZE - 0.5);
    ctx.lineTo(rect.width, RULER_SIZE - 0.5);
  } else {
    ctx.moveTo(RULER_SIZE - 0.5, 0);
    ctx.lineTo(RULER_SIZE - 0.5, rect.height);
  }
  ctx.stroke();

  // Позиция курсора
  if (props.cursor !== null) {
    const pos = Math.round(toScreen(props.cursor)) + 0.5;
    ctx.strokeStyle = "#ef4444";
    ctx.beginPath();
    if (horizontal) {
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, RULER_SIZE);
    } else {
      ctx.moveTo(0, pos);
      ctx.lineTo(RULER_SIZE, pos);
    }
    ctx.stroke();
  }
}

function scheduleDraw() {
  if (frame) return;
  frame = requestAnimationFrame(draw);
}

watch(
  () => [props.zoom, props.origin, props.canvasSize, props.cursor, props.highlight],
  scheduleDraw,
  { deep: true },
);

onMounted(() => {
  scheduleDraw();
  if (canvasRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(scheduleDraw);
    resizeObserver.observe(canvasRef.value);
  }
});

onUnmounted(() => {
  resizeObserver?.disconnect();
  if (frame) cancelAnimationFrame(frame);
});
</script>

<style scoped>
.editor-ruler {
  position: absolute;
  display: block;
  z-index: 5;
  pointer-events: none;
}

/* <canvas> — заменяемый элемент и не растягивается через left/right,
   поэтому размеры задаются явно */
.editor-ruler.horizontal {
  top: 0;
  left: 20px;
  width: calc(100% - 20px);
  height: 20px;
}

.editor-ruler.vertical {
  top: 20px;
  left: 0;
  width: 20px;
  height: calc(100% - 20px);
}
</style>
