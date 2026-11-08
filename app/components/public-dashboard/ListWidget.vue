<template>
  <div class="pd-scroll h-full min-h-0 overflow-auto">
    <div v-if="!data.rows.length" class="pd-muted flex h-full items-center justify-center text-sm">Нет записей</div>
    <table v-else class="w-full border-separate border-spacing-0 text-sm">
      <thead>
        <tr>
          <th
            v-for="c in data.columns"
            :key="c.key"
            class="pd-muted pd-th sticky top-0 whitespace-nowrap px-2 py-1.5 text-xs font-medium"
            :class="alignClass(c.align)"
          >
            {{ c.label }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, i) in data.rows"
          :key="i"
          :class="{ 'pd-row-now': row._state === 'now', 'pd-row-done': row._state === 'done' }"
        >
          <td
            v-for="c in data.columns"
            :key="c.key"
            class="pd-td px-2 py-2 align-middle"
            :class="[alignClass(c.align), c.progress ? 'w-28 min-w-24' : '']"
          >
            <div v-if="c.progress" class="flex items-center gap-2">
              <div class="pd-track h-1.5 flex-1 overflow-hidden rounded-full">
                <div class="pd-bar h-full rounded-full" :style="{ width: `${Number(row[c.key]) || 0}%` }" />
              </div>
              <span class="pd-muted w-9 text-right text-xs tabular-nums">{{ row[c.key] }}%</span>
            </div>
            <span v-else-if="c.key === 'time'" class="whitespace-nowrap font-medium tabular-nums">
              <span v-if="row._state === 'now'" class="pd-live-dot" />{{ row[c.key] }}
            </span>
            <span
              v-else-if="c.key === 'place'"
              class="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold"
              :class="Number(row[c.key]) <= 3 ? 'pd-place-top' : 'pd-muted'"
            >{{ row[c.key] }}</span>
            <span v-else class="line-clamp-2" :class="c.align === 'right' ? 'tabular-nums' : ''">{{ row[c.key] ?? "—" }}</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  data: {
    columns: { key: string; label: string; align?: "left" | "right" | "center"; progress?: boolean }[];
    rows: Record<string, any>[];
  };
}>();

const alignClass = (a?: string) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
</script>
