<template>
  <div class="pd-week h-full min-h-0" :style="{ gridTemplateColumns: `repeat(${data.days.length || 1}, minmax(150px, 1fr))` }">
    <div v-if="!data.days.length" class="pd-muted flex h-full items-center justify-center text-sm">Нет занятий в этом периоде</div>
    <section v-for="day in data.days" :key="day.key" class="pd-week-day" :class="{ 'pd-week-day--today': day.isToday }">
      <header class="pd-week-head">
        <span class="font-semibold">{{ day.weekday }}</span>
        <span class="pd-muted text-xs">{{ day.date }}</span>
        <span v-if="day.isToday" class="pd-week-today">сегодня</span>
        <span class="pd-muted ml-auto text-xs tabular-nums">{{ day.events.length || "" }}</span>
      </header>
      <div class="pd-scroll flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto p-1.5">
        <p v-if="!day.events.length" class="pd-muted py-4 text-center text-xs">Нет занятий</p>
        <article
          v-for="(e, i) in day.events"
          :key="i"
          class="pd-week-ev"
          :class="[`pd-ev--${e.type}`, `pd-ev-state--${e.state}`]"
        >
          <div class="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
            <span v-if="e.state === 'now'" class="pd-live-dot" />
            {{ e.start }}–{{ e.end }}
            <span class="pd-ev-kind ml-auto">{{ kindShort(e.type) }}</span>
          </div>
          <p class="mt-0.5 line-clamp-2 text-xs leading-snug">{{ e.title }}</p>
          <p class="pd-muted mt-0.5 truncate text-[11px]">{{ e.group }} · {{ e.room }}</p>
          <p v-if="e.instructor" class="pd-muted truncate text-[11px]">{{ e.instructor }}</p>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { eventKindShort } from "../../../shared/utils/scheduleLabels";

defineProps<{
  data: {
    days: {
      key: string;
      weekday: string;
      date: string;
      isToday: boolean;
      events: { start: string; end: string; title: string; type: string; group: string; room: string; instructor: string; state: string }[];
    }[];
  };
}>();

const kindShort = (t: string) => eventKindShort(t);
</script>

<style>
.pd-week {
  display: grid;
  gap: 8px;
  overflow-x: auto;
}
.pd-week-day {
  display: flex;
  min-height: 0;
  min-width: 0;
  flex-direction: column;
  border-radius: 12px;
  border: 1px solid var(--pd-border);
  background: color-mix(in srgb, var(--pd-bg) 55%, transparent);
}
.pd-week-day--today {
  border-color: var(--pd-accent);
  box-shadow: inset 0 0 0 1px var(--pd-accent);
}
.pd-week-head {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 8px 10px 6px;
  font-size: 0.875rem;
  border-bottom: 1px solid var(--pd-border);
}
.pd-week-today {
  border-radius: 9999px;
  background: var(--pd-accent);
  color: #fff;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
}
.pd-week-ev {
  --ev: var(--pd-accent);
  border-radius: 8px;
  border-left: 3px solid var(--ev);
  background: color-mix(in srgb, var(--ev) 12%, var(--pd-card));
  padding: 6px 8px;
}
.pd-ev--practice {
  --ev: #10b981;
}
.pd-ev--assessment {
  --ev: #f59e0b;
}
.pd-ev--other {
  --ev: #64748b;
}
.pd-ev-kind {
  border-radius: 4px;
  background: color-mix(in srgb, var(--ev) 25%, transparent);
  padding: 0 4px;
  font-size: 10px;
}
.pd-ev-state--done {
  opacity: 0.45;
}
.pd-ev-state--now {
  box-shadow: 0 0 0 2px var(--ev);
}
</style>
