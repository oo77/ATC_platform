<template>
  <Teleport to="body">
    <div
      v-if="visible"
      ref="menuRef"
      :style="{ top: position.y + 'px', left: position.x + 'px' }"
      class="fixed z-99999 min-w-48 rounded-md border border-stroke bg-white shadow-lg dark:border-strokedark dark:bg-boxdark"
      @click="handleMenuClick"
    >
      <div class="py-2">
        <button
          v-for="(item, index) in items"
          :key="index"
          @click="item.action"
          :disabled="item.disabled"
          class="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-black hover:bg-gray-100 dark:text-white dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <component :is="item.icon" v-if="item.icon" class="h-5 w-5" :class="item.iconClass" />
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- Backdrop для закрытия меню -->
    <div
      v-if="visible"
      class="fixed inset-0 z-99998"
      @click="close"
      @contextmenu.prevent="close"
    ></div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue';

export interface ContextMenuItem {
  label: string;
  action: () => void;
  icon?: any;
  iconClass?: string;
  disabled?: boolean;
}

interface ContextMenuProps {
  visible: boolean;
  position: { x: number; y: number };
  items: ContextMenuItem[];
}

const props = defineProps<ContextMenuProps>();

const emit = defineEmits<{
  close: [];
}>();

const menuRef = ref<HTMLElement | null>(null);

const handleMenuClick = (event: MouseEvent) => {
  // Закрываем меню после клика на любой пункт
  nextTick(() => {
    close();
  });
};

const close = () => {
  emit('close');
};

// Закрытие по Escape
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.visible) {
    close();
  }
};

// Корректировка позиции меню если оно выходит за границы экрана
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick();
    
    if (menuRef.value) {
      const menu = menuRef.value;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let { x, y } = props.position;

      // Проверка выхода за правую границу
      if (rect.right > viewportWidth) {
        x = viewportWidth - rect.width - 10;
      }

      // Проверка выхода за нижнюю границу
      if (rect.bottom > viewportHeight) {
        y = viewportHeight - rect.height - 10;
      }

      // Проверка выхода за левую границу
      if (x < 0) {
        x = 10;
      }

      // Проверка выхода за верхнюю границу
      if (y < 0) {
        y = 10;
      }

      menu.style.left = x + 'px';
      menu.style.top = y + 'px';
    }
  }
});

onMounted(() => {
  document.addEventListener('keydown', handleEscape);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape);
});
</script>
