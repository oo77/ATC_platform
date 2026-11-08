<template>
  <Teleport to="body">
    <template v-if="visible">
      <div class="fixed inset-0 z-[99998]" @click="close" @contextmenu.prevent="close" />
      <div
        ref="menuRef"
        role="menu"
        :style="{ top: pos.y + 'px', left: pos.x + 'px' }"
        class="fixed z-[99999] min-w-56 rounded-xl border border-gray-200 bg-white p-1.5 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
      >
        <template v-for="(item, i) in items" :key="i">
          <div v-if="item.separator" class="my-1 h-px bg-gray-100 dark:bg-gray-800" role="separator" />
          <button
            v-else
            type="button"
            role="menuitem"
            :disabled="item.disabled"
            :class="[
              'flex w-full items-center justify-between gap-6 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-40',
              item.danger
                ? 'text-error-600 hover:bg-error-50 focus:bg-error-50 dark:text-error-400 dark:hover:bg-error-500/10'
                : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/[0.06] dark:focus:bg-white/[0.06]',
            ]"
            @click="run(item)"
          >
            <span>{{ item.label }}</span>
            <kbd v-if="item.hint" class="text-[11px] text-gray-400">{{ item.hint }}</kbd>
          </button>
        </template>
      </div>
    </template>
  </Teleport>
</template>

<script setup lang="ts">
export interface ContextMenuItem {
  label?: string;
  action?: () => void;
  disabled?: boolean;
  danger?: boolean;
  separator?: boolean;
  hint?: string;
}

const props = defineProps<{
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}>();
const emit = defineEmits<{ close: [] }>();

const menuRef = ref<HTMLElement | null>(null);
const pos = ref({ x: 0, y: 0 });
const close = () => emit('close');

const run = (item: ContextMenuItem) => {
  close();
  item.action?.();
};

const move = (dir: number) => {
  const btns = Array.from(menuRef.value?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
  if (!btns.length) return;
  const i = btns.indexOf(document.activeElement as HTMLButtonElement);
  btns[(i + dir + btns.length) % btns.length].focus();
};

// Меню не должно вылезать за экран
watch(() => [props.visible, props.position.x, props.position.y], async () => {
  if (!props.visible) return;
  pos.value = { ...props.position };
  await nextTick();
  const el = menuRef.value;
  if (!el) return;
  const r = el.getBoundingClientRect();
  pos.value = {
    x: Math.max(8, Math.min(props.position.x, window.innerWidth - r.width - 8)),
    y: Math.max(8, Math.min(props.position.y, window.innerHeight - r.height - 8)),
  };
  el.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
}, { immediate: true });
</script>
