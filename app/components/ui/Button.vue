<template>
  <component
    :is="to && !isDisabled ? NuxtLinkComp : 'button'"
    v-bind="to && !isDisabled ? { to } : { type, disabled: isDisabled }"
    :aria-busy="loading || undefined"
    :aria-disabled="isDisabled || undefined"
    :class="[
      'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition-colors duration-150',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-gray-900',
      icon ? iconSizeClasses[size] : sizeClasses[size],
      variantClasses[variant],
      block ? 'w-full' : '',
      className,
      { 'cursor-not-allowed opacity-50': isDisabled },
    ]"
    @click="handleClick"
  >
    <!-- Индикатор загрузки -->
    <span v-if="loading" class="flex items-center" aria-hidden="true">
      <span class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent"></span>
    </span>

    <!-- Иконка слева или startIcon -->
    <span v-if="(startIcon || $slots.iconLeft) && !loading" class="flex items-center [&>svg]:h-4 [&>svg]:w-4">
      <component v-if="startIcon" :is="startIcon" />
      <slot v-else name="iconLeft" />
    </span>

    <!-- Основной контент -->
    <slot v-if="!(icon && loading)"></slot>

    <!-- Иконка справа или endIcon -->
    <span v-if="(endIcon || $slots.iconRight) && !loading" class="flex items-center [&>svg]:h-4 [&>svg]:w-4">
      <component v-if="endIcon" :is="endIcon" />
      <slot v-else name="iconRight" />
    </span>
  </component>
</template>

<script setup lang="ts">
import { computed, resolveComponent } from 'vue'

type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'danger'
  | 'warning'
  | 'outline'
  | 'ghost'
  | 'soft'
  | 'danger-ghost'
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg'

interface ButtonProps {
  size?: ButtonSize
  variant?: ButtonVariant
  startIcon?: object
  endIcon?: object
  className?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
  /** Отрисовать как NuxtLink */
  to?: string | Record<string, any>
  /** Квадратная кнопка-иконка (обязательно задайте aria-label/title) */
  icon?: boolean
  /** На всю ширину */
  block?: boolean
}

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'md',
  variant: 'primary',
  className: '',
  disabled: false,
  loading: false,
  type: 'button',
  icon: false,
  block: false,
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const NuxtLinkComp = resolveComponent('NuxtLink')

const isDisabled = computed(() => props.disabled || props.loading)

// Плотная шкала: 28 / 32 / 36 / 40 px
const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2 py-1 text-xs',
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-3.5 py-2 text-sm',
  lg: 'px-4 py-2.5 text-sm',
}

const iconSizeClasses: Record<ButtonSize, string> = {
  xs: 'h-7 w-7 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-9 w-9 text-sm',
  lg: 'h-10 w-10 text-sm',
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white shadow-theme-xs hover:bg-primary-600 active:bg-primary-700 focus-visible:ring-primary',
  secondary:
    'bg-gray-100 text-gray-800 hover:bg-gray-200 focus-visible:ring-gray-400 dark:bg-white/[0.06] dark:text-gray-200 dark:hover:bg-white/10',
  success:
    'bg-success text-white shadow-theme-xs hover:bg-success-700 focus-visible:ring-success',
  danger:
    'bg-danger text-white shadow-theme-xs hover:bg-error-700 focus-visible:ring-danger',
  warning:
    'bg-warning text-white shadow-theme-xs hover:bg-warning-700 focus-visible:ring-warning',
  outline:
    'bg-white text-gray-700 shadow-theme-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-gray-900 focus-visible:ring-primary dark:bg-white/[0.03] dark:text-gray-300 dark:ring-gray-700 dark:hover:bg-white/[0.06] dark:hover:text-white',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400 dark:text-gray-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
  soft:
    'bg-primary-50 text-primary-700 hover:bg-primary-100 focus-visible:ring-primary dark:bg-primary-500/15 dark:text-primary-300 dark:hover:bg-primary-500/25',
  'danger-ghost':
    'bg-transparent text-error-600 hover:bg-error-50 focus-visible:ring-danger dark:text-error-400 dark:hover:bg-error-500/10',
}

const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }
  emit('click', event)
}
</script>
