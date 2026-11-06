<template>
  <!--
    UiConfirmModal v2 — подтверждение опасных/необратимых действий.
    Совместим со старым API (isOpen, title, message, itemName, warning, confirmText,
    cancelText, variant, loading; emits confirm/cancel).
    Новое:
      requireText  — пользователь должен ввести слово/код (удаление группы, смена секретов);
      loadingText  — подпись на кнопке во время операции (раньше всегда «Удаление...»);
    Во время loading закрыть окно нельзя (нет двойных отправок и «потерянных» операций).
  -->
  <UiModal :is-open="isOpen" :title="title" size="sm" @close="handleCancel">
    <div class="flex flex-col items-center text-center">
      <!-- Спокойная иконка без пульсации: красная для danger, жёлтая для warning -->
      <span
        :class="[
          'mb-3 flex h-12 w-12 items-center justify-center rounded-full',
          variant === 'danger' ? 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400' : 'bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400',
        ]"
      >
        <Trash2 v-if="variant === 'danger'" class="h-6 w-6" />
        <AlertTriangle v-else class="h-6 w-6" />
      </span>

      <p class="text-sm text-gray-600 dark:text-gray-300">{{ message }}</p>
      <p v-if="itemName" class="mt-2 break-words text-base font-semibold text-gray-900 dark:text-white">{{ itemName }}</p>

      <p v-if="warning" class="mt-3 w-full rounded-lg bg-error-50 px-3 py-2 text-left text-sm text-error-700 dark:bg-error-500/10 dark:text-error-300">
        {{ warning }}
      </p>

      <!-- Ввод для подтверждения: кнопка активируется только при точном совпадении -->
      <div v-if="requireText" class="mt-4 w-full text-left">
        <label class="mb-1 block text-xs text-gray-500 dark:text-gray-400">
          Для подтверждения введите <span class="select-all font-mono font-semibold text-gray-800 dark:text-gray-100">{{ requireText }}</span>
        </label>
        <input
          v-model="typed"
          type="text"
          autocomplete="off"
          class="h-9 w-full rounded-lg border border-gray-300 bg-transparent px-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-gray-700 dark:text-white"
          @keydown.enter.prevent="canConfirm && handleConfirm()"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <UiButton variant="outline" :disabled="loading" @click="handleCancel">{{ cancelText }}</UiButton>
        <UiButton :variant="variant === 'danger' ? 'danger' : 'warning'" :loading="loading" :disabled="!canConfirm" @click="handleConfirm">
          {{ loading ? loadingText || confirmText : confirmText }}
        </UiButton>
      </div>
    </template>
  </UiModal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AlertTriangle, Trash2 } from 'lucide-vue-next'

interface Props {
  isOpen: boolean
  title?: string
  message?: string
  itemName?: string
  warning?: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning'
  loading?: boolean
  /** Слово/код, которое нужно ввести для подтверждения */
  requireText?: string
  /** Подпись кнопки во время выполнения («Архивация…») */
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Подтверждение удаления',
  message: 'Вы уверены, что хотите удалить этот элемент?',
  confirmText: 'Удалить',
  cancelText: 'Отмена',
  variant: 'danger',
  loading: false,
})

const emit = defineEmits<{ confirm: []; cancel: [] }>()

const typed = ref('')
// При каждом открытии начинаем с чистого поля
watch(() => props.isOpen, (v) => v && (typed.value = ''))

// Подтверждение доступно, если нет загрузки и (при необходимости) введён верный текст
const canConfirm = computed(() => !props.loading && (!props.requireText || typed.value.trim() === props.requireText))

const handleConfirm = () => {
  if (canConfirm.value) emit('confirm')
}
// Во время операции закрытие блокируем
const handleCancel = () => {
  if (!props.loading) emit('cancel')
}
</script>
