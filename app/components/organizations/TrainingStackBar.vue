<template>
  <div
    class="flex w-full gap-0.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
    :class="heightClass"
    role="img"
    :aria-label="ariaLabel"
  >
    <div
      v-for="segment in segments"
      :key="segment.key"
      class="h-full transition-[flex-grow] duration-500"
      :class="segment.class"
      :style="{ flexGrow: segment.value, flexBasis: 0 }"
      :title="`${segment.label}: ${segment.value}`"
    ></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { TrainingCounts } from "~/../server/types/organizationTraining";

const props = withDefaults(
  defineProps<{
    counts: Pick<TrainingCounts, "certified" | "noCertificate" | "inTraining">;
    size?: "sm" | "md" | "lg";
  }>(),
  { size: "md" },
);

/** Цвета проверены на различимость при дальтонизме (светлая и тёмная тема) */
const SEGMENTS = [
  { key: "certified", label: "С сертификатом", class: "bg-success-600" },
  { key: "noCertificate", label: "Сертификат не выдан", class: "bg-warning-500 dark:bg-warning-600" },
  { key: "inTraining", label: "Проходят обучение", class: "bg-blue-light-600" },
] as const;

const segments = computed(() =>
  SEGMENTS.map((s) => ({ ...s, value: props.counts[s.key] })).filter((s) => s.value > 0),
);

const heightClass = computed(
  () => ({ sm: "h-1.5", md: "h-2", lg: "h-3" })[props.size],
);

const ariaLabel = computed(() =>
  SEGMENTS.map((s) => `${s.label}: ${props.counts[s.key]}`).join(", "),
);
</script>
