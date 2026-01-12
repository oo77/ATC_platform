<template>
  <div class="rounded-lg bg-white dark:bg-boxdark p-6 shadow-md">
    <div class="flex items-center gap-4">
      <div 
        class="flex h-12 w-12 items-center justify-center rounded-full"
        :class="iconBgClass"
      >
        <component :is="icon" class="w-6 h-6" :class="iconColorClass" />
      </div>
      <div class="flex-1">
        <h3 class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ title }}</h3>
        <div class="flex items-center gap-2">
          <p class="text-2xl font-bold text-black dark:text-white">{{ formattedValue }}</p>
          <span 
            v-if="trend !== undefined" 
            class="text-xs font-medium"
            :class="trend >= 0 ? 'text-success' : 'text-danger'"
          >
            {{ trend >= 0 ? '+' : '' }}{{ trend }}%
          </span>
        </div>
        <p v-if="subtitle" class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {{ subtitle }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [Number, String],
    required: true
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: [Object, Function],
    required: true
  },
  color: {
    type: String,
    default: 'primary',
    validator: (val) => ['primary', 'success', 'warning', 'danger', 'info'].includes(val)
  },
  trend: {
    type: Number,
    default: undefined
  },
  format: {
    type: String,
    default: 'number',
    validator: (val) => ['number', 'currency', 'percent', 'raw'].includes(val)
  }
});

const colorClasses = {
  primary: {
    bg: 'bg-primary/10',
    icon: 'text-primary'
  },
  success: {
    bg: 'bg-success/10',
    icon: 'text-success'
  },
  warning: {
    bg: 'bg-warning/10',
    icon: 'text-warning'
  },
  danger: {
    bg: 'bg-danger/10',
    icon: 'text-danger'
  },
  info: {
    bg: 'bg-info/10',
    icon: 'text-info'
  }
};

const iconBgClass = computed(() => colorClasses[props.color]?.bg || colorClasses.primary.bg);
const iconColorClass = computed(() => colorClasses[props.color]?.icon || colorClasses.primary.icon);

const formattedValue = computed(() => {
  if (props.format === 'raw') return props.value;
  if (props.format === 'currency') return `${props.value.toLocaleString('ru-RU')} ₽`;
  if (props.format === 'percent') return `${props.value}%`;
  if (typeof props.value === 'number') return props.value.toLocaleString('ru-RU');
  return props.value;
});
</script>
