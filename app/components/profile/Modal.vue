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
        v-if="isVisible"
        class="fixed inset-0 z-99999 flex items-center justify-center overflow-y-auto p-4"
      >
        <!-- Backdrop -->
        <div
          class="fixed inset-0 bg-black/50 backdrop-blur"
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
          <div v-if="isVisible" @click.stop>
            <slot name="body"></slot>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  isOpen?: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const isVisible = ref(false);

// Показываем модальное окно с небольшой задержкой для плавной анимации
watch(
  () => props.isOpen,
  (newValue) => {
    if (newValue) {
      setTimeout(() => {
        isVisible.value = true;
      }, 10);
    } else {
      isVisible.value = false;
    }
  },
  { immediate: true }
);

// Блокировка прокрутки body при открытии модального окна
watch(isVisible, (visible) => {
  if (visible) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
});

const handleClose = () => {
  isVisible.value = false;
  setTimeout(() => {
    emit('close');
  }, 200); // Ждем завершения анимации
};
</script>
