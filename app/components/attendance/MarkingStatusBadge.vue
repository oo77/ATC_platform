<script setup lang="ts">
/**
 * Бейдж статуса отметки посещаемости
 */

import { 
  MARKING_STATUS_LABELS, 
  MARKING_STATUS_COLORS, 
  MARKING_STATUS_ICONS,
  type AttendanceMarkingStatus,
} from '~/types/attendanceMarking';

interface Props {
  status: AttendanceMarkingStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const props = withDefaults(defineProps<Props>(), {
  showIcon: true,
  size: 'md',
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'px-1.5 py-0.5 text-xs';
    case 'lg':
      return 'px-3 py-1.5 text-sm';
    default:
      return 'px-2 py-1 text-xs';
  }
});

const iconSize = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'w-3 h-3';
    case 'lg':
      return 'w-4 h-4';
    default:
      return 'w-3.5 h-3.5';
  }
});
</script>

<template>
  <span 
    :class="[MARKING_STATUS_COLORS[status], sizeClasses]"
    class="inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap"
  >
    <Icon 
      v-if="showIcon" 
      :name="MARKING_STATUS_ICONS[status]" 
      :class="iconSize" 
    />
    {{ MARKING_STATUS_LABELS[status] }}
  </span>
</template>
