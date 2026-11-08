<template>
  <div class="pd-scroll h-full min-h-0 overflow-y-auto">
    <div v-if="!data.items.length" class="flex h-full flex-col items-center justify-center gap-2 text-center">
      <span class="pd-ok-icon"><CheckCircle2 class="h-6 w-6" /></span>
      <p class="text-sm font-medium">Всё в порядке</p>
      <p class="pd-muted text-xs">Проблем, требующих внимания, не найдено</p>
    </div>
    <ul v-else class="flex flex-col gap-1.5">
      <li v-for="(a, i) in data.items" :key="i" class="pd-alert" :class="`pd-tone--${tone(a.level)}`">
        <component :is="icon(a.level)" class="pd-alert-icon h-4 w-4 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium">{{ a.title }}</p>
          <p v-if="a.detail" class="pd-muted truncate text-xs" :title="a.detail">{{ a.detail }}</p>
        </div>
        <span class="pd-alert-count tabular-nums">{{ a.count.toLocaleString("ru-RU") }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import { AlertOctagon, AlertTriangle, CheckCircle2, Info } from "lucide-vue-next";

defineProps<{
  data: { items: { level: "critical" | "warning" | "info"; title: string; detail?: string; count: number }[] };
}>();

const tone = (l: string) => (l === "critical" ? "danger" : l === "warning" ? "warning" : "info");
const icon = (l: string) => (l === "critical" ? AlertOctagon : l === "warning" ? AlertTriangle : Info);
</script>

<style>
.pd-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  border-radius: 10px;
  border: 1px solid var(--pd-border);
  border-left: 4px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 7%, var(--pd-card));
  padding: 8px 10px;
}
.pd-alert-icon {
  color: var(--tone);
}
.pd-alert-count {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--tone);
}
.pd-ok-icon {
  display: inline-flex;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: rgb(16 185 129 / 0.15);
  color: #10b981;
}
</style>
