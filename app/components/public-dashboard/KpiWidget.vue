<template>
  <div class="flex h-full min-h-0 flex-col justify-between gap-2">
    <div class="flex items-start justify-between gap-3">
      <p class="pd-muted line-clamp-2 text-sm font-medium leading-snug">{{ title }}</p>
      <span class="pd-icon-tile shrink-0">
        <component :is="icon" class="h-5 w-5" />
      </span>
    </div>
    <div class="min-w-0">
      <p class="pd-kpi-value truncate font-semibold tabular-nums leading-none">
        {{ formatted }}<span v-if="data?.suffix" class="pd-kpi-suffix">{{ data.suffix }}</span>
      </p>
      <p v-if="data?.hint" class="pd-muted mt-2 truncate text-xs">{{ data.hint }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount, type Component } from "vue";

const props = defineProps<{
  title: string;
  icon: Component;
  data: { value: number; suffix?: string; hint?: string } | null;
}>();

// Плавный пересчёт числа при обновлении данных
const shown = ref(props.data?.value ?? 0);
let raf = 0;

watch(
  () => props.data?.value,
  (to) => {
    if (to == null) return;
    cancelAnimationFrame(raf);
    const from = shown.value;
    if (from === to || typeof window === "undefined") {
      shown.value = to;
      return;
    }
    const start = performance.now();
    const dur = 700;
    const step = (t: number) => {
      const k = Math.min(1, (t - start) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      shown.value = Math.round(from + (to - from) * eased);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  },
);

onBeforeUnmount(() => cancelAnimationFrame(raf));

const formatted = computed(() => (props.data ? shown.value.toLocaleString("ru-RU") : "—"));
</script>
