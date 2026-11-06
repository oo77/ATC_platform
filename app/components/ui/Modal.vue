<template>
  <Teleport to="body">
    <!-- Backdrop с анимацией -->
    <Transition
      enter-active-class="transition-opacity duration-300 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-100000 flex items-center justify-center overflow-y-auto p-4"
        @click.self="handleBackdropClick"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-gray-900/50 backdrop-blur-[2px]"
          aria-hidden="true"
        ></div>

        <!-- Модальное окно с анимацией -->
        <Transition
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 scale-95 -translate-y-4"
          enter-to-class="opacity-100 scale-100 translate-y-0"
          leave-active-class="transition-all duration-200 ease-in"
          leave-from-class="opacity-100 scale-100 translate-y-0"
          leave-to-class="opacity-0 scale-95 -translate-y-4"
        >
          <div
            v-if="isOpen"
            :class="[
              'relative bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-theme-xl w-full flex flex-col',
              sizeClasses[size],
              'max-h-[90vh]',
            ]"
            role="dialog"
            aria-modal="true"
            :aria-label="title"
            @click.stop
          >
            <!-- Header -->
            <div
              v-if="title || $slots.header"
              class="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 shrink-0"
            >
              <slot name="header">
                <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                  {{ title }}
                </h3>
              </slot>
              <button
                type="button"
                @click="$emit('close')"
                class="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200 transition-colors"
                aria-label="Закрыть"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <!-- Body (scrollable) -->
            <div :class="['flex-1', bodyClass || 'px-5 py-4 overflow-y-auto']">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="px-5 py-3.5 border-t border-gray-100 dark:border-gray-800 shrink-0"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, watch } from "vue";

type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

interface ModalProps {
  isOpen: boolean;
  title?: string;
  size?: ModalSize;
  closeOnBackdrop?: boolean;
  bodyClass?: string;
}

const props = withDefaults(defineProps<ModalProps>(), {
  size: "md",
  closeOnBackdrop: false,
});

const emit = defineEmits<{
  close: [];
}>();

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-full mx-4",
};

const handleBackdropClick = () => {
  if (props.closeOnBackdrop) {
    emit("close");
  }
};

// Закрытие по Esc — стандартное ожидание пользователя от диалога
const onKeydown = (e: KeyboardEvent) => {
  if (e.key === "Escape") emit("close");
};

// Блокировка прокрутки body и Esc — только пока окно открыто
watch(
  () => props.isOpen,
  (isOpen) => {
    if (typeof document === "undefined") return; // SSR: DOM недоступен
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.addEventListener("keydown", onKeydown);
    } else {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKeydown);
    }
  },
  { immediate: true },
);

// Если компонент уничтожили при открытом окне — не оставляем заблокированную страницу
onBeforeUnmount(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
</style>