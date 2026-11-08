<template>
  <div class="flex h-full flex-col items-center justify-center text-center">
    <p class="pd-clock font-semibold tabular-nums leading-none">
      {{ time }}<span v-if="showSeconds" class="pd-muted pd-clock-sec">{{ seconds }}</span>
    </p>
    <p class="pd-muted mt-2 text-sm first-letter:uppercase">{{ date }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

defineProps<{ showSeconds?: boolean }>();

const now = ref(new Date());
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000);
});
onBeforeUnmount(() => clearInterval(timer));

const time = computed(() => now.value.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" }));
const seconds = computed(() => `:${String(now.value.getSeconds()).padStart(2, "0")}`);
const date = computed(() =>
  now.value.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
);
</script>
