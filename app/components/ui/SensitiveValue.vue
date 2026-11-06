<template>
  <!--
    UiSensitiveValue — ПИНФЛ, паспорт, телефон: по умолчанию маска,
    «глаз» показывает значение (автоскрытие через N секунд), кнопка копирует.
    Только отображение — данные и запросы не меняются.
  -->
  <span class="inline-flex items-center gap-1.5 align-middle">
    <span class="font-mono text-sm tabular-nums" :aria-live="revealed ? 'polite' : undefined">{{ shown }}</span>
    <template v-if="value">
      <button type="button" class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10" :title="revealed ? 'Скрыть' : 'Показать'" :aria-label="revealed ? 'Скрыть значение' : 'Показать значение'" @click="toggle">
        <component :is="revealed ? EyeOff : Eye" class="h-3.5 w-3.5" />
      </button>
      <button type="button" class="rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-white/10" title="Копировать" aria-label="Копировать значение" @click="copy">
        <component :is="copied ? Check : Copy" class="h-3.5 w-3.5" />
      </button>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { Check, Copy, Eye, EyeOff } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ value?: string | null; visibleTail?: number; autoHideSeconds?: number }>(), {
  visibleTail: 3,
  autoHideSeconds: 15,
})

const revealed = ref(false)
const copied = ref(false)
let hideTimer: ReturnType<typeof setTimeout> | undefined
let copyTimer: ReturnType<typeof setTimeout> | undefined

// Маска оставляет только последние символы — достаточно для сверки, но не для утечки с экрана
const shown = computed(() => {
  const v = props.value ?? ''
  if (!v) return '—'
  if (revealed.value) return v
  const tail = v.slice(-props.visibleTail)
  return '•'.repeat(Math.max(v.length - props.visibleTail, 4)) + tail
})

const toggle = () => {
  revealed.value = !revealed.value
  clearTimeout(hideTimer)
  // Автоскрытие: если пользователь отвлёкся, значение не останется на экране
  if (revealed.value && props.autoHideSeconds > 0) {
    hideTimer = setTimeout(() => (revealed.value = false), props.autoHideSeconds * 1000)
  }
}

const copy = async () => {
  try {
    await navigator.clipboard.writeText(props.value ?? '')
    copied.value = true
    clearTimeout(copyTimer)
    copyTimer = setTimeout(() => (copied.value = false), 1500)
  } catch {
    /* буфер обмена недоступен (http/права) — молча игнорируем, значение можно показать глазом */
  }
}

onBeforeUnmount(() => {
  clearTimeout(hideTimer)
  clearTimeout(copyTimer)
})
</script>
