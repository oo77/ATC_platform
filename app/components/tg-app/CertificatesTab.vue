<template>
  <div class="tg-certificates-tab">
    <!-- Проверка доступа -->
    <div v-if="!permissions?.can_view_certificates" class="tg-no-permission">
      <div class="tg-icon-wrapper">
        <svg
          class="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <h3>Нет доступа</h3>
      <p>У вас нет прав на просмотр сертификатов</p>
    </div>

    <div v-else>
      <!-- Фильтры -->
      <div class="tg-filters">
        <!-- Поиск по имени -->
        <div class="tg-search-wrapper">
          <svg
            class="tg-search-icon"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по имени студента..."
            class="tg-search-input"
          />
        </div>

        <!-- Фильтр по дате -->
        <div class="tg-filter-row">
          <select v-model="selectedPeriod" class="tg-select">
            <option value="">Все периоды</option>
            <option
              v-for="period in availablePeriods"
              :key="period"
              :value="period"
            >
              {{ period }}
            </option>
          </select>

          <!-- Фильтр по группе -->
          <select v-model="selectedGroup" class="tg-select">
            <option value="">Все группы</option>
            <option
              v-for="group in availableGroups"
              :key="group"
              :value="group"
            >
              {{ group }}
            </option>
          </select>
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка сертификатов...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <div class="tg-icon-wrapper">
          <svg
            class="w-10 h-10"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p>{{ error }}</p>
        <button @click="loadCertificates" class="tg-btn-retry">
          Повторить
        </button>
      </div>

      <!-- Список сертификатов -->
      <div v-else-if="filteredCertificates.length > 0">
        <!-- Заголовок с кнопкой скачать ZIP -->
        <div class="tg-list-header">
          <div class="tg-header-info">
            <h3>Сертификаты</h3>
            <span class="tg-count">{{ filteredCertificates.length }}</span>
          </div>
          <button
            v-if="selectedGroup && filteredCertificates.length > 0"
            @click="downloadGroupZip"
            :disabled="downloadingZip"
            class="tg-btn-zip"
          >
            <svg
              v-if="!downloadingZip"
              class="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            <div v-else class="tg-spinner-small"></div>
            <span>{{ downloadingZip ? "Загрузка..." : "ZIP" }}</span>
          </button>
        </div>

        <!-- Таблица сертификатов -->
        <div class="tg-table-wrapper">
          <table class="tg-table">
            <thead>
              <tr>
                <th style="width: 80%">Сертификат</th>
                <th style="width: 20%; text-align: center">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(cert, index) in filteredCertificates"
                :key="index"
                :class="{ revoked: cert.status === 'revoked' }"
              >
                <!-- Столбец 1: Данные сертификата -->
                <td class="tg-cell-info">
                  <div class="tg-student-name">{{ cert.studentName }}</div>
                  <div class="tg-cert-details">
                    <span class="tg-course-name">{{ cert.courseName }}</span>
                  </div>
                  <div class="tg-cert-meta">
                    <span class="tg-date">{{ cert.issueDate }}</span>
                    <span class="tg-separator">•</span>
                    <span class="tg-group-badge-small">{{
                      cert.groupCode
                    }}</span>
                  </div>
                </td>

                <!-- Столбец 2: Действия -->
                <td class="tg-cell-actions">
                  <button
                    v-if="cert.pdfFileUrl && cert.status === 'issued'"
                    @click="sendCertificateToBot(cert)"
                    :disabled="sendingCertId === cert.id"
                    class="tg-btn-send"
                    title="Скачать (отправить в чат)"
                  >
                    <div
                      v-if="sendingCertId === cert.id"
                      class="tg-spinner-small"
                    ></div>
                    <svg
                      v-else
                      class="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                  <span
                    v-else-if="cert.status === 'revoked'"
                    class="tg-revoked-badge"
                  >
                    Отозван
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Пусто -->
      <div v-else class="tg-empty-state">
        <div class="tg-icon-wrapper">
          <svg
            class="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h3>Нет сертификатов</h3>
        <p v-if="searchQuery || selectedPeriod || selectedGroup">
          Попробуйте изменить фильтры
        </p>
        <p v-else>В данный момент нет выданных сертификатов</p>
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
  representative: {
    type: Object,
    required: true,
  },
});

// Состояние
const loading = ref(false);
const error = ref(null);
const certificates = ref([]);
const searchQuery = ref("");
const selectedPeriod = ref("");
const selectedGroup = ref("");
const sendingCertId = ref(null);
const downloadingZip = ref(false);

// Доступные периоды
const availablePeriods = computed(() => {
  const periods = new Set();

  certificates.value.forEach((cert) => {
    if (cert.issueDate) {
      const parts = cert.issueDate.split(".");
      if (parts.length === 3) {
        const month = parts[1];
        const year = parts[2];
        periods.add(`${month}.${year}`);
      }
    }
  });

  return Array.from(periods).sort((a, b) => {
    const [aMonth, aYear] = a.split(".").map(Number);
    const [bMonth, bYear] = b.split(".").map(Number);
    if (aYear !== bYear) return bYear - aYear;
    return bMonth - aMonth;
  });
});

// Доступные группы
const availableGroups = computed(() => {
  const groups = new Set();
  certificates.value.forEach((cert) => {
    if (cert.groupCode) {
      groups.add(cert.groupCode);
    }
  });
  return Array.from(groups).sort();
});

// Фильтрованные сертификаты
const filteredCertificates = computed(() => {
  let result = certificates.value;

  // Поиск по имени
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((cert) =>
      cert.studentName.toLowerCase().includes(query),
    );
  }

  // Фильтр по периоду
  if (selectedPeriod.value) {
    result = result.filter((cert) => {
      if (!cert.issueDate) return false;
      const parts = cert.issueDate.split(".");
      if (parts.length !== 3) return false;
      const period = `${parts[1]}.${parts[2]}`;
      return period === selectedPeriod.value;
    });
  }

  // Фильтр по группе
  if (selectedGroup.value) {
    result = result.filter((cert) => cert.groupCode === selectedGroup.value);
  }

  return result;
});

// Отправить сертификат в бот
async function sendCertificateToBot(cert) {
  if (!cert.pdfFileUrl) return;

  sendingCertId.value = cert.id;

  try {
    const response = await $fetch("/api/tg-app/send-certificate", {
      method: "POST",
      body: {
        certificateId: cert.id,
        chatId: props.representative.telegramChatId,
        pdfUrl: cert.pdfFileUrl,
        studentName: cert.studentName,
        certificateNumber: cert.certificateNumber,
      },
    });

    if (response.success) {
      // Показываем уведомление через Telegram WebApp
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Сертификат отправлен в чат!");
      }
    }
  } catch (err) {
    console.error("Ошибка отправки сертификата:", err);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert("Ошибка отправки сертификата");
    }
  } finally {
    sendingCertId.value = null;
  }
}

// Скачать ZIP архив группы
async function downloadGroupZip() {
  if (!selectedGroup.value) return;

  downloadingZip.value = true;

  try {
    const response = await $fetch("/api/tg-app/download-group-certificates", {
      method: "POST",
      body: {
        groupCode: selectedGroup.value,
        organizationId: props.organizationId,
        chatId: props.representative.telegramChatId,
      },
    });

    if (response.success) {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("ZIP архив отправлен в чат!");
      }
    }
  } catch (err) {
    console.error("Ошибка скачивания ZIP:", err);
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert("Ошибка создания архива");
    }
  } finally {
    downloadingZip.value = false;
  }
}

// Загрузка сертификатов
async function loadCertificates() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch("/api/tg-app/certificates", {
      params: {
        organizationId: props.organizationId,
      },
    });

    certificates.value = data.certificates || [];
  } catch (err) {
    console.error("Ошибка загрузки сертификатов:", err);
    error.value = err.data?.message || "Не удалось загрузить сертификаты";
  } finally {
    loading.value = false;
  }
}

// Загрузка при монтировании
watch(
  () => props.organizationId,
  (newId) => {
    if (newId) {
      loadCertificates();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.tg-certificates-tab {
  padding: 0;
}

/* Нет доступа */
.tg-no-permission,
.tg-loading-block,
.tg-error-block,
.tg-empty-state {
  text-align: center;
  padding: 3rem 1rem;
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

.tg-no-permission p,
.tg-empty-state p {
  color: #64748b;
  font-size: 0.9375rem;
}

/* Фильтры */
.tg-filters {
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.tg-search-wrapper {
  position: relative;
}

.tg-search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #64748b;
  pointer-events: none;
}

.tg-search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.tg-search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tg-search-input::placeholder {
  color: #94a3b8;
}

.tg-filter-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.tg-select {
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.tg-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Загрузка */
.tg-loading-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.tg-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

.tg-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: tg-spin 0.6s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}

.tg-loading-block p {
  color: #64748b;
  font-size: 0.9375rem;
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

.tg-btn-retry {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-retry:active {
  transform: scale(0.98);
}

/* Заголовок списка */
.tg-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}

.tg-header-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-list-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.tg-count {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.tg-btn-zip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-zip:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn-zip:not(:disabled):active {
  transform: scale(0.98);
}

/* Таблица */
.tg-table-wrapper {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
}

.tg-table {
  width: 100%;
  border-collapse: collapse;
}

.tg-table thead {
  background: #f8fafc;
}

.tg-table th {
  padding: 0.875rem 0.75rem;
  text-align: left;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-bottom: 1px solid #e2e8f0;
}

.tg-table tbody tr {
  border-bottom: 1px solid #f1f5f9;
  transition: background 0.15s;
}

.tg-table tbody tr:last-child {
  border-bottom: none;
}

.tg-table tbody tr:active {
  background: #f8fafc;
}

.tg-table tbody tr.revoked {
  opacity: 0.5;
}

/* Стили для 2-х колоночной таблицы */

.tg-cell-info {
  padding: 0.875rem 0.75rem;
  max-width: 0; /* Для работы ellipsis внутри flex/grid */
  width: 100%;
}

.tg-cell-actions {
  padding: 0.5rem;
  vertical-align: middle;
  text-align: right;
  width: 60px;
  white-space: nowrap;
}

.tg-student-name {
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 0.125rem;
  font-size: 0.9375rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-cert-details {
  margin-bottom: 0.25rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-course-name {
  font-size: 0.75rem;
  color: #64748b;
}

.tg-cert-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #94a3b8;
}

.tg-number {
  font-family: ui-monospace, monospace;
  color: #475569;
  background: #f1f5f9;
  padding: 0 0.25rem;
  border-radius: 4px;
}

.tg-separator {
  color: #cbd5e1;
}

.tg-group-badge-small {
  display: inline-block;
  padding: 0.1rem 0.35rem;
  background: #eff6ff;
  color: #2563eb;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
}

.tg-btn-send {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: #eff6ff;
  color: #2563eb;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn-send:not(:disabled):active {
  transform: scale(0.95);
  background: #dbeafe;
}

.tg-revoked-badge {
  display: inline-block;
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #dc2626;
  border-radius: 6px;
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
}
</style>
