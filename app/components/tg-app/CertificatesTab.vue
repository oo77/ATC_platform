<template>
  <div class="tg-certificates-tab">
    <!-- Проверка доступа -->
    <div v-if="!permissions?.can_view_certificates" class="tg-no-permission">
      <span class="tg-icon">🚫</span>
      <h3>Нет доступа</h3>
      <p>У вас нет прав на просмотр сертификатов</p>
    </div>

    <div v-else>
      <!-- Фильтр по периоду -->
      <div class="tg-filters">
        <select v-model="selectedPeriod" class="tg-select">
          <option value="">Все периоды</option>
          <option v-for="period in availablePeriods" :key="period" :value="period">
            {{ period }}
          </option>
        </select>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка сертификатов...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <span class="tg-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadCertificates" class="tg-btn-retry">Повторить</button>
      </div>

      <!-- Сертификаты -->
      <div v-else-if="filteredCertificates.length > 0" class="tg-certificates-list">
        <div class="tg-list-header">
          <h3>Сертификаты</h3>
          <span class="tg-count">{{ filteredCertificates.length }}</span>
        </div>

        <!-- Группировка по курсам -->
        <div v-for="(courseData, courseKey) in groupedCertificates" :key="courseKey" class="tg-course-section">
          <div class="tg-course-header">
            <h4>{{ courseData.courseName }}</h4>
            <span class="tg-group-code">{{ courseData.groupCode }}</span>
          </div>

          <!-- Список сертификатов -->
          <div class="tg-cert-items">
            <div 
              v-for="(cert, index) in courseData.certificates" 
              :key="index"
              class="tg-cert-card"
              :class="{ revoked: cert.status === 'revoked' }"
            >
              <div class="tg-cert-status">
                <span class="tg-status-icon" :class="`tg-status-${cert.status}`">
                  {{ cert.status === 'issued' ? '✅' : '❌' }}
                </span>
              </div>

              <div class="tg-cert-content">
                <h5 class="tg-cert-student">{{ cert.studentName }}</h5>
                
                <div class="tg-cert-info">
                  <div class="tg-cert-detail">
                    <span class="tg-detail-label">№</span>
                    <span class="tg-detail-value">{{ cert.certificateNumber }}</span>
                  </div>
                  <div class="tg-cert-detail">
                    <span class="tg-detail-label">Выдан</span>
                    <span class="tg-detail-value">{{ cert.issueDate }}</span>
                  </div>
                </div>

                <!-- Результат -->
                <div class="tg-cert-result" :class="{ passed: cert.hasPassed }">
                  <span class="tg-result-icon">{{ cert.hasPassed ? '🎓' : '⚠️' }}</span>
                  <span class="tg-result-text">
                    {{ cert.hasPassed ? 'Прошёл обучение' : 'Не соответствует требованиям' }}
                  </span>
                  <span v-if="cert.attendancePercent !== null" class="tg-attendance">
                    ({{ Math.round(cert.attendancePercent) }}%)
                  </span>
                </div>

                <!-- Статус отозван -->
                <div v-if="cert.status === 'revoked'" class="tg-revoked-notice">
                  ⛔ Сертификат отозван
                </div>

                <!-- Скачать PDF -->
                <button 
                  v-if="cert.pdfFileUrl && cert.status === 'issued'"
                  @click="downloadCertificate(cert)"
                  class="tg-download-btn"
                >
                  <span>📄</span>
                  <span>Скачать PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Пусто -->
      <div v-else class="tg-empty-state">
        <span class="tg-empty-icon">📜</span>
        <h3>Нет сертификатов</h3>
        <p v-if="selectedPeriod">Попробуйте выбрать другой период</p>
        <p v-else>В данный момент нет выданных сертификатов для слушателей вашей организации</p>
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
const certificates = ref([]);
const selectedPeriod = ref('');

// Доступные периоды
const availablePeriods = computed(() => {
  const periods = new Set();
  
  certificates.value.forEach(cert => {
    if (cert.issueDate) {
      const parts = cert.issueDate.split('.');
      if (parts.length === 3) {
        const month = parts[1];
        const year = parts[2];
        periods.add(`${month}.${year}`);
      }
    }
  });

  return Array.from(periods).sort((a, b) => {
    const [aMonth, aYear] = a.split('.').map(Number);
    const [bMonth, bYear] = b.split('.').map(Number);
    if (aYear !== bYear) return bYear - aYear;
    return bMonth - aMonth;
  });
});

// Фильтрованные сертификаты
const filteredCertificates = computed(() => {
  if (!selectedPeriod.value) return certificates.value;

  return certificates.value.filter(cert => {
    if (!cert.issueDate) return false;
    const parts = cert.issueDate.split('.');
    if (parts.length !== 3) return false;
    const period = `${parts[1]}.${parts[2]}`;
    return period === selectedPeriod.value;
  });
});

// Группировка по курсам
const groupedCertificates = computed(() => {
  const grouped = {};

  filteredCertificates.value.forEach(cert => {
    const key = `${cert.courseName}_${cert.groupCode}`;
    
    if (!grouped[key]) {
      grouped[key] = {
        courseName: cert.courseName,
        groupCode: cert.groupCode,
        certificates: [],
      };
    }

    grouped[key].certificates.push(cert);
  });

  return grouped;
});

// Скачать сертификат
function downloadCertificate(cert) {
  if (cert.pdfFileUrl) {
    window.open(cert.pdfFileUrl, '_blank');
  }
}

// Загрузка сертификатов
async function loadCertificates() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch('/api/tg-app/certificates', {
      params: {
        organizationId: props.organizationId,
      },
    });

    certificates.value = data.certificates || [];

  } catch (err) {
    console.error('Ошибка загрузки сертификатов:', err);
    error.value = err.data?.message || 'Не удалось загрузить сертификаты';
  } finally {
    loading.value = false;
  }
}

// Загрузка при монтировании
watch(() => props.organizationId, (newId) => {
  if (newId) {
    loadCertificates();
  }
}, { immediate: true });
</script>

<style scoped>
.tg-certificates-tab {
  padding: 1rem 0;
}

/* Фильтры */
.tg-filters {
  margin-bottom: 1rem;
}

.tg-select {
  width: 100%;
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 0.9375rem;
  cursor: pointer;
}

/* Список */
.tg-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.tg-list-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f1f5f9;
}

.tg-count {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Курс */
.tg-course-section {
  margin-bottom: 1.5rem;
}

.tg-course-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
  padding: 0 0.5rem;
}

.tg-course-header h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

.tg-group-code {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Карточка сертификата */
.tg-cert-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tg-cert-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  transition: all 0.2s;
}

.tg-cert-card.revoked {
  opacity: 0.7;
  border-color: rgba(239, 68, 68, 0.3);
}

.tg-cert-status {
  flex-shrink: 0;
}

.tg-status-icon {
  font-size: 1.5rem;
  display: block;
}

.tg-cert-content {
  flex: 1;
}

.tg-cert-student {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.75rem 0;
}

.tg-cert-info {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.tg-cert-detail {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.tg-detail-label {
  color: #64748b;
}

.tg-detail-value {
  color: #94a3b8;
  font-weight: 500;
}

/* Результат */
.tg-cert-result {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
}

.tg-cert-result.passed {
  background: rgba(34, 197, 94, 0.1);
  border: 1px solid rgba(34, 197, 94, 0.2);
}

.tg-cert-result:not(.passed) {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.2);
}

.tg-result-icon {
  font-size: 1.125rem;
}

.tg-result-text {
  flex: 1;
  color: #94a3b8;
}

.tg-attendance {
  color: #64748b;
  font-size: 0.8125rem;
}

/* Отозван */
.tg-revoked-notice {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
  color: #f87171;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  font-weight: 500;
}

/* Кнопка скачать */
.tg-download-btn {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 10px;
  color: white;
  font-weight: 600;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-download-btn:active {
  transform: scale(0.98);
}

/* Общие стили */
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
  margin-top: 1rem;
}

@keyframes tg-spin {
  to { transform: rotate(360deg); }
}
</style>
