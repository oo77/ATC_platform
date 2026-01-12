<template>
  <div 
    :class="[
      'rounded-xl p-6 text-white shadow-lg',
      hoverEffect ? 'transform transition-transform hover:scale-105' : '',
      gradientClass
    ]"
  >
    <div class="flex items-center justify-between">
      <div>
        <p class="text-sm font-medium opacity-90">{{ label }}</p>
        <p :class="['mt-2 font-bold', large ? 'text-4xl' : 'text-3xl']">{{ value }}</p>
      </div>
      <div :class="['flex items-center justify-center rounded-full bg-white/20', large ? 'h-14 w-14' : 'h-12 w-12']">
        <slot name="icon">
          <component 
            v-if="icon" 
            :is="icon" 
            :class="large ? 'w-8 h-8' : 'w-6 h-6'" 
          />
        </slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

type GradientVariant = 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'indigo' | 'gray';

interface Props {
  label: string;
  value: string | number;
  variant?: GradientVariant;
  icon?: Component;
  large?: boolean;
  hoverEffect?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'blue',
  large: false,
  hoverEffect: false,
});

// Mapping вариантов к gradient классам
const gradientMap: Record<GradientVariant, string> = {
  blue: 'bg-gradient-to-br from-blue-500 to-blue-600',
  green: 'bg-gradient-to-br from-green-500 to-green-600',
  purple: 'bg-gradient-to-br from-purple-500 to-purple-600',
  orange: 'bg-gradient-to-br from-orange-500 to-orange-600',
  red: 'bg-gradient-to-br from-red-500 to-red-600',
  indigo: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  gray: 'bg-gradient-to-br from-gray-500 to-gray-600',
};

const gradientClass = computed(() => gradientMap[props.variant]);
</script>
