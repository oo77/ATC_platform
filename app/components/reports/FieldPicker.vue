<template>
  <div class="flex flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-boxdark">
    <!-- Поиск -->
    <div class="border-b border-gray-100 p-2 dark:border-gray-800">
      <div class="relative">
        <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
        <input
          ref="searchInput"
          v-model="query"
          type="search"
          placeholder="Поиск поля… (например «слушател», «дата»)"
          aria-label="Поиск поля"
          class="w-full rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-7 text-xs text-gray-800 outline-none focus:border-primary focus:bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
          @keydown.enter.prevent="addFirstMatch"
          @keydown.escape.stop="query = ''"
        />
        <button
          v-if="query"
          type="button"
          class="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
          aria-label="Очистить поиск"
          @click="query = ''"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
      <div class="mt-1.5 flex items-center justify-between gap-2 text-[11px] text-gray-500">
        <label class="flex cursor-pointer select-none items-center gap-1.5">
          <input v-model="onlySelected" type="checkbox" class="h-3 w-3 accent-primary" />
          Только выбранные ({{ selectedKeys.size }})
        </label>
        <div class="flex items-center gap-2">
          <span v-if="query" class="tabular-nums">Найдено: {{ matchCount }}</span>
          <button type="button" class="hover:text-primary" @click="toggleAll">
            {{ allOpen ? "Свернуть" : "Развернуть" }}
          </button>
        </div>
      </div>
    </div>

    <!-- Группы полей -->
    <div class="max-h-[55vh] overflow-y-auto">
      <div v-if="visibleGroups.length === 0" class="px-4 py-8 text-center text-xs text-gray-400">
        Ничего не найдено. Попробуйте другое слово.
      </div>
      <div
        v-for="group in visibleGroups"
        :key="group.key"
        class="border-b border-gray-100 last:border-b-0 dark:border-gray-800"
      >
        <button
          type="button"
          class="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50"
          :aria-expanded="isOpen(group.key)"
          @click="toggleGroup(group.key)"
        >
          <span class="text-[11px] font-semibold uppercase tracking-wider text-gray-600 dark:text-gray-300">
            {{ group.label }}
          </span>
          <span class="flex items-center gap-1.5">
            <span
              v-if="group.selected > 0"
              class="rounded-full bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary"
            >{{ group.selected }}</span>
            <ChevronDown
              class="h-3.5 w-3.5 text-gray-400 transition-transform"
              :class="isOpen(group.key) ? 'rotate-180' : ''"
            />
          </span>
        </button>
        <ul v-show="isOpen(group.key)" class="pb-1">
          <li v-for="field in group.fields" :key="field.key">
            <button
              type="button"
              class="group/f flex w-full items-center gap-2 px-3 py-1 text-left hover:bg-primary/5"
              :aria-pressed="selectedKeys.has(field.key)"
              :title="field.key"
              @click="$emit('toggle', field)"
            >
              <span
                class="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border transition-colors"
                :class="selectedKeys.has(field.key) ? 'border-primary bg-primary text-white' : 'border-gray-300 dark:border-gray-600'"
              >
                <Check v-if="selectedKeys.has(field.key)" class="h-2.5 w-2.5" />
              </span>
              <span class="flex-1 text-[13px] leading-tight text-gray-700 dark:text-gray-300">
                <template v-for="(p, i) in highlightParts(field.label, query)" :key="i">
                  <mark v-if="p.hit" class="rounded bg-amber-200/70 text-inherit dark:bg-amber-500/30">{{ p.text }}</mark>
                  <template v-else>{{ p.text }}</template>
                </template>
              </span>
              <span
                class="w-5 shrink-0 text-center text-[10px] font-semibold text-gray-400"
                :title="TYPE_TITLES[field.type] || field.type"
              >{{ FIELD_TYPE_BADGE[field.type] || "·" }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { Search, X, ChevronDown, Check } from "lucide-vue-next";
import {
  buildMatcher,
  highlightParts,
  FIELD_TYPE_BADGE,
  type EntityGroupMeta,
  type FieldMeta,
} from "~/utils/reportBuilder";

const props = defineProps<{
  groups: EntityGroupMeta[];
  selectedKeys: Set<string>;
}>();

const emit = defineEmits<{ (e: "toggle", field: FieldMeta): void }>();

const TYPE_TITLES: Record<string, string> = {
  text: "Текст",
  enum: "Список значений",
  number: "Число",
  computed: "Вычисляемое",
  date: "Дата",
  datetime: "Дата и время",
  boolean: "Да/нет",
};

const query = ref("");
const onlySelected = ref(false);
const openGroups = ref<Set<string>>(new Set());
const searchInput = ref<HTMLInputElement | null>(null);

const visibleGroups = computed(() => {
  const match = buildMatcher(query.value);
  return props.groups
    .map((g) => {
      const groupHit = match ? match(g.label) : false;
      const fields = g.fields.filter((f) => {
        if (onlySelected.value && !props.selectedKeys.has(f.key)) return false;
        if (!match) return true;
        // Совпадение по названию поля, его ключу или названию раздела
        return groupHit || match(`${f.label} ${f.key}`);
      });
      return {
        key: g.key,
        label: g.label,
        fields,
        selected: g.fields.filter((f) => props.selectedKeys.has(f.key)).length,
      };
    })
    .filter((g) => g.fields.length > 0);
});

const matchCount = computed(() => visibleGroups.value.reduce((n, g) => n + g.fields.length, 0));

// При поиске/фильтре все найденные разделы раскрыты
const forceOpen = computed(() => !!query.value.trim() || onlySelected.value);
const isOpen = (key: string) => forceOpen.value || openGroups.value.has(key);
const allOpen = computed(() => props.groups.every((g) => isOpen(g.key)));

const toggleGroup = (key: string) => {
  const next = new Set(openGroups.value);
  if (next.has(key)) next.delete(key);
  else next.add(key);
  openGroups.value = next;
};

const toggleAll = () => {
  openGroups.value = allOpen.value ? new Set() : new Set(props.groups.map((g) => g.key));
};

// Разделы с выбранными полями раскрываем один раз при загрузке
watch(
  () => props.groups.length,
  () => {
    const next = new Set(openGroups.value);
    for (const g of props.groups) {
      if (g.fields.some((f) => props.selectedKeys.has(f.key))) next.add(g.key);
    }
    if (next.size === 0 && props.groups[0]) next.add(props.groups[0].key);
    openGroups.value = next;
  },
  { immediate: true },
);

/** Enter в поиске — добавить первое невыбранное найденное поле */
const addFirstMatch = () => {
  if (!query.value.trim()) return;
  for (const g of visibleGroups.value) {
    const f = g.fields.find((x) => !props.selectedKeys.has(x.key));
    if (f) {
      const meta = props.groups.flatMap((x) => x.fields).find((x) => x.key === f.key);
      if (meta) emit("toggle", meta);
      return;
    }
  }
};

defineExpose({ focus: () => searchInput.value?.focus() });
</script>
