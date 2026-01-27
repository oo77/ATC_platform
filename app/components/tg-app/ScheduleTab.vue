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
        <div
          v-for="dateGroup in groupedSchedule"
          :key="dateGroup.date"
          class="tg-date-group"
        >
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
                <div
                  class="tg-event-type"
                  :class="`tg-type-${event.eventType}`"
                >
                  <span class="tg-type-icon">{{
                    getTypeIcon(event.eventType)
                  }}</span>
                  <span class="tg-type-label">{{
                    getTypeLabel(event.eventType)
                  }}</span>
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
        <p>
          В ближайшее время нет запланированных занятий для слушателей вашей
          организации
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

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

  schedule.value.forEach((event) => {
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
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// День недели
function formatDayOfWeek(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ru-RU", { weekday: "long" });
}

// Иконка типа занятия
function getTypeIcon(type) {
  const icons = {
    theory: "📖",
    practice: "💻",
    knowledge_check: "📝",
    retake: "🔄",
  };
  return icons[type] || "📚";
}

// Метка типа занятия
function getTypeLabel(type) {
  const labels = {
    theory: "Теория",
    practice: "Практика",
    knowledge_check: "Проверка знаний",
    retake: "Пересдача",
  };
  return labels[type] || type;
}

// Загрузка расписания
async function loadSchedule() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch("/api/tg-app/schedule", {
      params: {
        organizationId: props.organizationId,
      },
    });

    schedule.value = data.schedule || [];
  } catch (err) {
    console.error("Ошибка загрузки расписания:", err);
    error.value = err.data?.message || "Не удалось загрузить расписание";
  } finally {
    loading.value = false;
  }
}

// Загрузка при монтировании
watch(
  () => props.organizationId,
  (newId) => {
    if (newId) {
      loadSchedule();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.tg-schedule-tab {
  padding: 0;
}

/* Общие состояния */
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

.tg-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.tg-no-permission h3,
.tg-empty-state h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.tg-loading-block p,
.tg-no-permission p,
.tg-empty-state p {
  color: #64748b;
  font-size: 0.9375rem;
}

.tg-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

.tg-btn-retry {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1rem;
}

/* Ошибка */
.tg-error-block .tg-icon-wrapper {
  background: #fee2e2;
  color: #dc2626;
}

.tg-error-block p {
  color: #dc2626;
  margin-bottom: 1rem;
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
  padding: 0 0.25rem;
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
  color: #1e293b;
  margin: 0;
}

.tg-date-info p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  text-transform: capitalize;
}

.tg-events-count {
  background: #eff6ff;
  color: #2563eb;
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
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.tg-event-card:active {
  background: #f8fafc;
}

.tg-event-time {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: #eff6ff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  min-width: 70px;
  align-self: flex-start;
}

.tg-time {
  font-size: 0.875rem;
  font-weight: 700;
  color: #2563eb;
}

.tg-time-separator {
  font-size: 0.75rem;
  color: #93c5fd;
  margin: 0.125rem 0;
}

.tg-event-content {
  flex: 1;
}

.tg-event-type {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.625rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.tg-type-theory {
  background: #f0f9ff;
  color: #0284c7;
  border: 1px solid #e0f2fe;
}

.tg-type-practice {
  background: #f5f3ff;
  color: #7c3aed;
  border: 1px solid #ede9fe;
}

.tg-type-knowledge_check {
  background: #fefce8;
  color: #d97706;
  border: 1px solid #fef9c3;
}

.tg-type-retake {
  background: #fef2f2;
  color: #dc2626;
  border: 1px solid #fee2e2;
}

.tg-type-icon {
  font-size: 0.875rem;
}

.tg-event-discipline {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
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
  font-size: 0.8125rem;
  color: #64748b;
}

.tg-detail-icon {
  font-size: 0.875rem;
  width: 1.25rem;
  text-align: center;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
