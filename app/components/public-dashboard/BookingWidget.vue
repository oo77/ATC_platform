<template>
  <div class="pd-book pd-scroll h-full min-h-0 overflow-auto">
    <div v-if="!data.rooms.length" class="pd-muted flex h-full items-center justify-center text-sm">
      {{ data.empty || "Нет данных" }}
    </div>
    <table v-else class="pd-book-table">
      <thead>
        <tr>
          <th class="pd-book-room pd-book-corner">
            <span>Аудитория</span>
            <span v-if="data.clashCount" class="pd-book-clash-badge">Накладок: {{ data.clashCount }}</span>
          </th>
          <th
            v-for="c in data.columns"
            :key="c.key"
            class="pd-book-col"
            :class="{ 'pd-book-col--current': c.isCurrent }"
          >
            <div class="font-semibold">{{ c.label }}</div>
            <div v-if="c.sub" class="pd-muted text-[11px] font-normal">{{ c.sub }}</div>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="room in data.rooms" :key="room.id">
          <th class="pd-book-room">
            <div class="font-semibold">{{ room.name }}</div>
            <div v-if="room.subtitle" class="pd-muted text-[11px] font-normal">{{ room.subtitle }}</div>
          </th>
          <td
            v-for="c in data.columns"
            :key="c.key"
            class="pd-book-cell"
            :class="{ 'pd-book-cell--current': c.isCurrent }"
          >
            <p v-if="!room.cells[c.key]?.length" class="pd-muted py-1 text-center text-xs">—</p>
            <article
              v-for="(b, i) in room.cells[c.key]"
              :key="i"
              class="pd-book-item"
              :class="[`pd-ev--${b.type}`, { 'pd-book-item--clash': b.clash, 'pd-book-item--now': b.now }]"
            >
              <div class="flex items-center gap-1.5 text-xs font-semibold tabular-nums">
                <span v-if="b.now" class="pd-live-dot" />
                <span class="truncate">{{ [b.days, b.time].filter(Boolean).join(" · ") }}</span>
                <span v-if="b.clash" class="pd-book-clash-badge ml-auto">Накладка</span>
                <span v-else-if="b.retake" class="pd-ev-kind ml-auto">Пересдача</span>
                <span v-else class="pd-ev-kind ml-auto">{{ kindShort(b.type) }}</span>
              </div>
              <p v-if="b.course" class="mt-0.5 line-clamp-2 text-xs leading-snug">{{ b.course }}</p>
              <p v-if="b.group" class="pd-muted truncate text-[11px]">
                {{ b.group }}<template v-if="b.count > 1"> · {{ b.count }} зан.</template
                ><template v-if="b.hours != null"> · {{ b.hours }} ч</template>
              </p>
              <p v-else-if="b.hours != null" class="pd-muted truncate text-[11px]">{{ b.hours }} ч</p>
              <p v-if="b.instructors" class="pd-muted truncate text-[11px]">{{ b.instructors }}</p>
              <p v-if="b.bookedBy || b.bookedAt" class="pd-book-by truncate text-[11px]">
                бронь: {{ [b.bookedBy, b.bookedAt].filter(Boolean).join(", ") }}
              </p>
            </article>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import { eventKindShort } from "../../../shared/utils/scheduleLabels";
import type { WidgetData } from "../../../shared/utils/publicDashboard";

defineProps<{ data: Extract<WidgetData, { kind: "booking" }> }>();

const kindShort = (t: string) => eventKindShort(t);
</script>

<style>
.pd-book-table {
  border-collapse: separate;
  border-spacing: 0;
  min-width: 100%;
  table-layout: fixed;
}
.pd-book-col {
  position: sticky;
  top: 0;
  z-index: 2;
  min-width: 170px;
  padding: 8px 10px 6px;
  text-align: left;
  font-size: 0.8125rem;
  background: var(--pd-card);
  border-bottom: 1px solid var(--pd-border);
}
.pd-book-col--current {
  box-shadow: inset 0 -2px 0 var(--pd-accent);
}
.pd-book-room {
  position: sticky;
  left: 0;
  z-index: 1;
  width: 130px;
  min-width: 130px;
  padding: 8px 10px;
  text-align: left;
  vertical-align: top;
  font-size: 0.875rem;
  background: var(--pd-card);
  border-right: 1px solid var(--pd-border);
  border-bottom: 1px solid var(--pd-border);
}
.pd-book-corner {
  top: 0;
  z-index: 3;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.pd-book-cell {
  vertical-align: top;
  padding: 6px;
  border-bottom: 1px solid var(--pd-border);
}
.pd-book-cell--current {
  background: color-mix(in srgb, var(--pd-accent) 6%, transparent);
}
.pd-book-cell > * + * {
  margin-top: 6px;
}
.pd-book-item {
  --ev: var(--pd-accent);
  border-radius: 8px;
  border-left: 3px solid var(--ev);
  background: color-mix(in srgb, var(--ev) 12%, var(--pd-card));
  padding: 6px 8px;
}
.pd-book-item--now {
  box-shadow: 0 0 0 2px var(--ev);
}
.pd-book-item--clash {
  --ev: #ef4444;
}
.pd-book-by {
  color: var(--pd-accent);
}
.pd-book-clash-badge {
  border-radius: 9999px;
  background: color-mix(in srgb, #ef4444 20%, transparent);
  color: #ef4444;
  padding: 0 6px;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  white-space: nowrap;
}
</style>
