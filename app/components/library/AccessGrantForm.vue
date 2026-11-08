<template>
  <!--
    Форма выдачи доступа: кому (пользователь / группа / курс / роль) и до какого срока.
    Поиск получателей идёт на сервере — видны все группы и пользователи, а не первые 10.
  -->
  <div class="space-y-4">
    <div>
      <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Кому выдать доступ</span>
      <div class="grid grid-cols-4 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/[0.06]" role="radiogroup">
        <button
          v-for="t in types"
          :key="t.id"
          type="button"
          role="radio"
          :aria-checked="type === t.id"
          class="flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-colors sm:text-sm"
          :class="type === t.id ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'"
          @click="setType(t.id)"
        >
          <component :is="t.icon" class="h-4 w-4 shrink-0" />
          <span class="truncate">{{ t.label }}</span>
        </button>
      </div>
      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">{{ typeHint }}</p>
    </div>

    <!-- Поиск получателя -->
    <div class="relative">
      <div v-if="selected" class="flex items-center gap-3 rounded-lg border border-brand-300 bg-brand-50/60 px-3 py-2 dark:border-brand-500/40 dark:bg-brand-500/10">
        <component :is="currentType.icon" class="h-4 w-4 shrink-0 text-brand-500" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-gray-900 dark:text-white">{{ selected.label }}</p>
          <p v-if="selected.description" class="truncate text-xs text-gray-500">{{ selected.description }}</p>
        </div>
        <button type="button" class="rounded p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200" aria-label="Выбрать другого" @click="clearSelected">
          <X class="h-4 w-4" />
        </button>
      </div>
      <template v-else>
        <div class="relative">
          <Search class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            ref="searchRef"
            v-model="q"
            type="text"
            :placeholder="currentType.placeholder"
            class="h-10 w-full rounded-lg border border-gray-300 bg-transparent pl-9 pr-3 text-sm text-gray-800 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-500/10 dark:border-gray-700 dark:text-gray-100"
            @input="onSearch"
            @focus="open = true"
            @keydown.down.prevent="move(1)"
            @keydown.up.prevent="move(-1)"
            @keydown.enter.prevent="pickActive"
            @keydown.esc="open = false"
          />
        </div>
        <div
          v-if="open"
          class="absolute left-0 right-0 top-[calc(100%+4px)] z-50 max-h-64 overflow-y-auto rounded-xl border border-gray-200 bg-white p-1 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900"
        >
          <p v-if="searching" class="px-3 py-3 text-sm text-gray-500">Поиск…</p>
          <p v-else-if="!items.length" class="px-3 py-3 text-sm text-gray-500">Ничего не найдено</p>
          <button
            v-for="(item, i) in items"
            v-else
            :key="item.id"
            type="button"
            class="flex w-full flex-col rounded-lg px-3 py-2 text-left transition-colors"
            :class="i === active ? 'bg-gray-100 dark:bg-white/[0.06]' : 'hover:bg-gray-50 dark:hover:bg-white/[0.04]'"
            @mousedown.prevent="pick(item)"
            @mouseenter="active = i"
          >
            <span class="text-sm text-gray-800 dark:text-gray-100">{{ item.label }}</span>
            <span v-if="item.description" class="line-clamp-2 text-xs text-gray-500" :title="item.description">{{ item.description }}</span>
          </button>
        </div>
      </template>
    </div>

    <!-- Срок -->
    <div>
      <span class="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Срок доступа</span>
      <div class="flex flex-wrap gap-1.5">
        <button
          v-for="p in presets"
          :key="p.id"
          type="button"
          class="rounded-full border px-3 py-1 text-xs font-medium transition-colors"
          :class="preset === p.id ? 'border-brand-500 bg-brand-500 text-white' : 'border-gray-300 text-gray-600 hover:border-gray-400 dark:border-gray-700 dark:text-gray-300'"
          @click="setPreset(p.id)"
        >
          {{ p.label }}
        </button>
      </div>
      <input
        v-if="preset === 'custom'"
        v-model="customDate"
        type="date"
        :min="tomorrow"
        max="2037-12-31"
        class="mt-2 h-9 rounded-lg border border-gray-300 bg-transparent px-3 text-sm text-gray-800 focus:border-brand-300 focus:outline-none dark:border-gray-700 dark:text-gray-100 dark:[color-scheme:dark]"
      />
      <p class="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
        {{ expiresAt ? `Доступ закроется автоматически ${formatDate(expiresAt)}` : "Доступ без ограничения по времени" }}
      </p>
    </div>

    <UiButton class="w-full" :disabled="!selected || submitting || (preset === 'custom' && !customDate)" :loading="submitting" @click="submit">
      {{ submitLabel }}
    </UiButton>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from "vue";
import { User, Users, GraduationCap, Shield, Search, X } from "lucide-vue-next";

type TargetType = "user" | "group" | "course" | "role";
interface Recipient { id: string; label: string; description?: string }

withDefaults(defineProps<{ submitLabel?: string; submitting?: boolean }>(), {
  submitLabel: "Выдать доступ",
  submitting: false,
});
const emit = defineEmits<{
  submit: [payload: { type: TargetType; targetId: string; label: string; expiresAt: string | null }];
}>();

const types = [
  { id: "user" as const, label: "Лично", icon: User, placeholder: "Имя или email…", hint: "Личный доступ одному пользователю" },
  { id: "group" as const, label: "Группа", icon: Users, placeholder: "Код группы или курс…", hint: "Всем слушателям группы — включая тех, кого добавят позже" },
  { id: "course" as const, label: "Курс", icon: GraduationCap, placeholder: "Название курса…", hint: "Слушателям всех групп этого курса" },
  { id: "role" as const, label: "Роль", icon: Shield, placeholder: "Роль…", hint: "Всем пользователям с этой ролью" },
];

const type = ref<TargetType>("group");
const currentType = computed(() => types.find((t) => t.id === type.value)!);
const typeHint = computed(() => currentType.value.hint);

const q = ref("");
const open = ref(false);
const searching = ref(false);
const items = ref<Recipient[]>([]);
const active = ref(0);
const selected = ref<Recipient | null>(null);
const searchRef = ref<HTMLInputElement | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;
let reqId = 0;
const load = async () => {
  const id = ++reqId;
  searching.value = true;
  try {
    const res = await $fetch<{ items: Recipient[] }>("/api/library/admin/recipients", {
      params: { type: type.value, q: q.value },
    });
    if (id === reqId) {
      items.value = res.items;
      active.value = 0;
    }
  } catch {
    if (id === reqId) items.value = [];
  } finally {
    if (id === reqId) searching.value = false;
  }
};
const onSearch = () => {
  open.value = true;
  clearTimeout(timer);
  timer = setTimeout(load, 250);
};
const move = (d: number) => {
  if (!items.value.length) return;
  active.value = (active.value + d + items.value.length) % items.value.length;
};
const pick = (item: Recipient) => {
  selected.value = item;
  open.value = false;
};
const pickActive = () => {
  const item = items.value[active.value];
  if (item) pick(item);
};
const clearSelected = async () => {
  selected.value = null;
  q.value = "";
  await nextTick();
  searchRef.value?.focus();
  load();
};
const setType = (t: TargetType) => {
  if (type.value === t) return;
  type.value = t;
  selected.value = null;
  q.value = "";
  items.value = [];
  load();
};
// Подсказки загружаем сразу, чтобы список был готов к первому фокусу
load();

// ---------- срок ----------
const presets = [
  { id: "none", label: "Бессрочно" },
  { id: "30", label: "30 дней" },
  { id: "90", label: "3 месяца" },
  { id: "365", label: "Год" },
  { id: "custom", label: "До даты…" },
];
const preset = ref("none");
const customDate = ref("");
const tomorrow = computed(() => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
});
const setPreset = (id: string) => {
  preset.value = id;
};
const expiresAt = computed<string | null>(() => {
  if (preset.value === "none") return null;
  if (preset.value === "custom") return customDate.value || null;
  const d = new Date();
  d.setDate(d.getDate() + Number(preset.value));
  return d.toISOString().slice(0, 10);
});
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

const submit = () => {
  if (!selected.value) return;
  emit("submit", { type: type.value, targetId: selected.value.id, label: selected.value.label, expiresAt: expiresAt.value });
};

/** Сброс выбора после успешной выдачи (вызывает родитель) */
const reset = () => {
  selected.value = null;
  q.value = "";
  preset.value = "none";
  customDate.value = "";
};
defineExpose({ reset });
</script>
