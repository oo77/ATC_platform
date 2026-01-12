<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-medium gap-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
      sizeClasses[size],
      variantClasses[variant],
      className,
      { 'cursor-not-allowed opacity-50': disabled || loading },
    ]"
    @click="handleClick"
  >
    <!-- Индикатор загрузки -->
    <span v-if="loading" class="flex items-center">
      <div class="h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-t-transparent"></div>
    </span>

    <!-- Иконка слева или startIcon -->
    <span v-if="(startIcon || $slots.iconLeft) && !loading" class="flex items-center">
      <component v-if="startIcon" :is="startIcon" />
      <slot v-else name="iconLeft" />
    </span>

    <!-- Основной контент -->
    <slot></slot>

    <!-- Иконка справа или endIcon -->
    <span v-if="(endIcon || $slots.iconRight) && !loading" class="flex items-center">
      <component v-if="endIcon" :is="endIcon" />
      <slot v-else name="iconRight" />
    </span>
  </button>
</template>

<script setup lang="ts">
type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps {
  size?: ButtonSize
  variant?: ButtonVariant
  startIcon?: object
  endIcon?: object
  className?: string
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<ButtonProps>(), {
  size: 'md',
  variant: 'primary',
  className: '',
  disabled: false,
  loading: false,
  type: 'button',
})

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-3.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

const variantClasses = {
  primary: 'bg-primary text-white hover:bg-opacity-90 focus:ring-primary',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-400 dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600',
  success: 'bg-success text-white hover:bg-opacity-90 focus:ring-success',
  danger: 'bg-danger text-white hover:bg-opacity-90 focus:ring-danger',
  warning: 'bg-warning text-white hover:bg-opacity-90 focus:ring-warning',
  outline:
    'bg-white text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/[0.03] dark:hover:text-gray-300',
}

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>
