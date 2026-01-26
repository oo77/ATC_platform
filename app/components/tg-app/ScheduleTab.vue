<template>
  <div class="tg-schedule-tab">
    <!-- Проверка доступа -->
    <div v-if="!permissions?.can_view_schedule" class="tg-no-permission">
      <span class="tg-icon">🚫</span>
      <h3>Нет доступа</h3>
      <p>У вас нет прав на просмотр расписания</p>
    </div>

    <div v-else>
      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка расписания...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <span class="tg-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadSchedule" class="tg-btn-retry">Повторить</button>
      </div>

      <!-- Расписание -->
      <div v-else-if="groupedSchedule.length > 0" class="tg-schedule-list">
        <!-- По датам -->
        <div v-for="dateGroup in groupedSchedule" :key="dateGroup.date" class="tg-date-group">
          <div class="tg-date-header">
            <span class="tg-date-icon">📅</span>
            <div class="tg-date-info">
              <h3>{{ formatDate(dateGroup.date) }}</h3>
              <p>{{ formatDayOfWeek(dateGroup.date) }}</p>
            </div>
            <span class="tg-events-count">{{ dateGroup.events.length }}</span>
          </div>

          <!-- События дня -->
          <div class="tg-events">
            <div 
              v-for="(event, index) in dateGroup.events" 
              :key="index"
              class="tg-event-card"
            >
              <div class="tg-event-time">
                <span class="tg-time">{{ event.startTime }}</span>
                <span class="tg-time-separator">-</span>
                <span class="tg-time">{{ event.endTime }}</span>
              </div>

              <div class="tg-event-content">
                <div class="tg-event-type" :class="`tg-type-${event.eventType}`">
                  <span class="tg-type-icon">{{ getTypeIcon(event.eventType) }}</span>
                  <span class="tg-type-label">{{ getTypeLabel(event.eventType) }}</span>
                </div>

                <h4 class="tg-event-discipline">{{ event.disciplineName }}</h4>

                <div class="tg-event-details">
                  <div class="tg-event-detail">
                    <span class="tg-detail-icon">👨‍🏫</span>
                    <span>{{ event.instructorName }}</span>
                  </div>
                  <div class="tg-event-detail">
                    <span class="tg-detail-icon">👥</span>
                    <span>{{ event.groupName }}</span>
                  </div>
                  <div v-if="event.location" class="tg-event-detail">
                    <span class="tg-detail-icon">🚪</span>
                    <span>{{ event.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пусто -->
      <div v-else class="tg-empty-state">
        <span class="tg-empty-icon">📅</span>
        <h3>Нет занятий</h3>
        <p>В ближайшее время нет запланированных занятий для слушателей вашей организации</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  organizationId: {
    type: String,
    required: true,
  },
  permissions: {
    type: Object,
    required: true,
  },
});

// Состояние
const loading = ref(false);
const error = ref(null);
const schedule = ref([]);

// Группировка по датам
const groupedSchedule = computed(() => {
  const grouped = {};

  schedule.value.forEach(event => {
    const date = event.date;
    if (!grouped[date]) {
      grouped[date] = {
        date,
        events: [],
      };
    }
    grouped[date].events.push(event);
  });

  // Сортируем по дате
  return Object.values(grouped).sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });
});

// Форматирование даты
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// День недели
function formatDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ru-RU', { weekday: 'long' });
}

// Иконка типа занятия
function getTypeIcon(type) {
  const icons = {
    theory: '📖',
    practice: '💻',
    knowledge_check: '📝',
    retake: '🔄',
  };
  return icons[type] || '📚';
}

// Метка типа занятия
function getTypeLabel(type) {
  const labels = {
    theory: 'Теория',
    practice: 'Практика',
    knowledge_check: 'Проверка знаний',
    retake: 'Пересдача',
  };
  return labels[type] || type;
}

// Загрузка расписания
async function loadSchedule() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch('/api/tg-app/schedule', {
      params: {
        organizationId: props.organizationId,
      },
    });

    schedule.value = data.schedule || [];

  } catch (err) {
    console.error('Ошибка загрузки расписания:', err);
    error.value = err.data?.message || 'Не удалось загрузить расписание';
  } finally {
    loading.value = false;
  }
}

// Загрузка при монтировании
watch(() => props.organizationId, (newId) => {
  if (newId) {
    loadSchedule();
  }
}, { immediate: true });
</script>

<style scoped>
.tg-schedule-tab {
  padding: 1rem 0;
}

/* Загрузка, ошибка, пусто - используем те же стили */
.tg-loading-block,
.tg-error-block,
.tg-empty-state,
.tg-no-permission {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.tg-icon,
.tg-empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.tg-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

.tg-btn-retry {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

/* Группа дат */
.tg-date-group {
  margin-bottom: 1.5rem;
}

.tg-date-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.tg-date-icon {
  font-size: 1.5rem;
}

.tg-date-info {
  flex: 1;
}

.tg-date-info h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
}

.tg-date-info p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
  text-transform: capitalize;
}

.tg-events-count {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* События */
.tg-events {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tg-event-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;
}

.tg-event-card:active {
  background: rgba(30, 41, 59, 0.6);
  transform: scale(0.99);
}

.tg-event-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 12px;
  min-width: 70px;
}

.tg-time {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #3b82f6;
}

.tg-time-separator {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0.125rem 0;
}

.tg-event-content {
  flex: 1;
}

.tg-event-type {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.tg-type-theory {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.tg-type-practice {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.tg-type-knowledge_check {
  background: rgba(234, 179, 8, 0.2);
  color: #fbbf24;
}

.tg-type-retake {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.tg-type-icon {
  font-size: 1rem;
}

.tg-event-discipline {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.75rem 0;
}

.tg-event-details {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.tg-event-detail {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.tg-detail-icon {
  font-size: 1rem;
}

@keyframes tg-spin {
  to { transform: rotate(360deg); }
}
</style>
