<template>
  <div class="flex h-full min-h-0 flex-col gap-2">
    <div v-if="data.summary.length" class="flex flex-wrap gap-1.5">
      <span v-for="s in data.summary" :key="s.tone" class="pd-chip" :class="`pd-tone--${s.tone}`">
        <span class="pd-dot" />{{ s.label }} <b class="tabular-nums">{{ s.count }}</b>
      </span>
    </div>
    <div v-if="!data.items.length" class="pd-muted flex flex-1 items-center justify-center text-sm">{{ data.empty || "Нет данных" }}</div>
    <div v-else class="pd-scroll pd-status-grid min-h-0 flex-1 overflow-y-auto">
      <article v-for="(it, i) in data.items" :key="i" class="pd-status" :class="`pd-tone--${it.tone}`">
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <p class="line-clamp-2 break-words text-sm font-semibold leading-snug" :title="it.title">{{ it.title }}</p>
            <p v-if="it.subtitle" class="pd-muted truncate text-[11px]">{{ it.subtitle }}</p>
          </div>
          <span class="pd-status-label">{{ it.label }}</span>
        </div>
        <p v-for="(l, j) in it.lines" :key="j" class="truncate text-xs" :class="j ? 'pd-muted' : ''">{{ l }}</p>
        <div v-if="it.badges?.length" class="mt-1 flex flex-wrap gap-1">
          <span v-for="(b, k) in it.badges" :key="k" class="pd-badge" :class="`pd-tone--${b.tone}`">{{ b.text }}</span>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    summary: { tone: string; label: string; count: number }[];
    items: { title: string; subtitle?: string; tone: string; label: string; lines: string[]; badges?: { tone: string; text: string }[] }[];
    empty?: string;
  };
}>();
</script>

<style>
.pd-tone--danger {
  --tone: #ef4444;
}
.pd-tone--warning {
  --tone: #f59e0b;
}
.pd-tone--success {
  --tone: #10b981;
}
.pd-tone--info {
  --tone: #3b82f6;
}
.pd-tone--muted {
  --tone: #64748b;
}
.pd-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border-radius: 9999px;
  border: 1px solid var(--pd-border);
  padding: 2px 10px;
  font-size: 12px;
}
.pd-dot {
  width: 8px;
  height: 8px;
  border-radius: 9999px;
  background: var(--tone);
}
.pd-status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  align-content: start;
  gap: 8px;
}
.pd-status {
  display: flex;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
  border-radius: 10px;
  border: 1px solid var(--pd-border);
  border-left: 4px solid var(--tone);
  background: color-mix(in srgb, var(--tone) 7%, var(--pd-card));
  padding: 8px 10px;
}
.pd-status.pd-tone--muted {
  background: var(--pd-card);
}
.pd-status-label {
  flex-shrink: 0;
  border-radius: 6px;
  background: color-mix(in srgb, var(--tone) 18%, transparent);
  color: var(--tone);
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
}
.pd-badge {
  border-radius: 6px;
  background: var(--tone);
  color: #fff;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 18px;
}
</style>
