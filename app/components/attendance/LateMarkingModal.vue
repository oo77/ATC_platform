<script setup lang="ts">
/**
 * Модальное окно для предупреждения об опоздании с отметкой
 * Показывается, когда срок отметки истёк, но ещё можно отметить с пометкой "Опоздание"
 */

import { AlertTriangle, Lock, Loader2 } from 'lucide-vue-next';

interface Props {
  modelValue: boolean;
  eventTitle: string;
  eventDate: string;
  deadline: string;
  status: 'late' | 'requires_approval';
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm', lateReason: string): void;
  (e: 'request-approval', reason: string): void;
  (e: 'cancel'): void;
}>();

const lateReason = ref('');
const loading = ref(false);

// Форматирование даты
function formatDate(dateStr: string): string {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Подтвердить отметку с опозданием
function onConfirm() {
  if (props.status === 'late') {
    emit('confirm', lateReason.value);
  } else {
    // Требуется одобрение — нужно отправить запрос
    if (!lateReason.value.trim() || lateReason.value.trim().length < 10) {
      return;
    }
    emit('request-approval', lateReason.value);
  }
  close();
}

// Отменить
function close() {
  emit('update:modelValue', false);
  emit('cancel');
  lateReason.value = '';
}

// Вычисляемые свойства
const isLateMode = computed(() => props.status === 'late');
const requiresApprovalMode = computed(() => props.status === 'requires_approval');
const isReasonValid = computed(() => {
  if (isLateMode.value) return true;
  return lateReason.value.trim().length >= 10;
});
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div 
        v-if="modelValue" 
        class="fixed inset-0 z-999 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div 
          class="absolute inset-0 bg-black/50"
          @click="close"
        />
        
        <!-- Modal -->
        <div 
          class="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6 animate-[fadeIn_0.2s_ease-out]"
        >
          <!-- Header -->
          <div class="flex items-start gap-4 mb-4">
            <div 
              :class="isLateMode 
                ? 'bg-yellow-100 dark:bg-yellow-900/30' 
                : 'bg-red-100 dark:bg-red-900/30'"
              class="shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
            >
              <component 
                :is="isLateMode ? AlertTriangle : Lock" 
                :class="isLateMode ? 'text-yellow-600' : 'text-red-600'"
                class="w-6 h-6" 
              />
            </div>
            
            <div>
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ isLateMode ? '⚠️ Срок отметки истёк' : '🔒 Требуется одобрение' }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ isLateMode 
                  ? 'Отметка будет сохранена с пометкой "Опоздание"' 
                  : 'Для отметки необходимо одобрение администратора' 
                }}
              </p>
            </div>
          </div>

          <!-- Event info -->
          <div 
            :class="isLateMode 
              ? 'bg-yellow-50 dark:bg-yellow-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'"
            class="rounded-lg p-4 mb-4"
          >
            <p class="text-sm">
              <strong>Занятие:</strong> {{ eventTitle }}
            </p>
            <p class="text-sm mt-1">
              <strong>Дата:</strong> {{ formatDate(eventDate) }}
            </p>
            <p class="text-sm mt-1">
              <strong>Дедлайн был:</strong> {{ formatDate(deadline) }}
            </p>
          </div>

          <!-- Reason input -->
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {{ requiresApprovalMode ? 'Причина опоздания (обязательно)' : 'Причина опоздания (опционально)' }}
              <span v-if="requiresApprovalMode" class="text-red-500">*</span>
            </label>
            <textarea
              v-model="lateReason"
              rows="3"
              :placeholder="requiresApprovalMode 
                ? 'Укажите причину опоздания с отметкой (минимум 10 символов)...' 
                : 'Укажите причину, если необходимо...'"
              class="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-3 text-sm
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-primary-500 focus:border-transparent
                     placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p 
              v-if="requiresApprovalMode && lateReason.length > 0 && lateReason.length < 10" 
              class="text-xs text-red-500 mt-1"
            >
              Минимум 10 символов (сейчас: {{ lateReason.length }})
            </p>
          </div>

          <!-- Actions -->
          <div class="flex gap-3 justify-end">
            <button
              @click="close"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 
                     rounded-lg transition-colors"
            >
              Отмена
            </button>
            
            <button
              @click="onConfirm"
              :disabled="!isReasonValid || loading"
              :class="isLateMode 
                ? 'bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400' 
                : 'bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400'"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors 
                     disabled:cursor-not-allowed"
            >
              <span v-if="loading" class="flex items-center gap-2">
                <Loader2 class="w-4 h-4 animate-spin" />
                Отправка...
              </span>
              <span v-else>
                {{ isLateMode ? 'Подтвердить отметку' : 'Отправить запрос' }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
