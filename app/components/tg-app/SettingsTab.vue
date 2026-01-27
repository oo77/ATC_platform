<template>
  <div class="tg-settings-tab">
    <!-- Профиль -->
    <div class="tg-settings-section">
      <h3 class="tg-section-title">Профиль</h3>

      <div class="tg-settings-card">
        <div class="tg-setting-item">
          <span class="tg-setting-label">ФИО</span>
          <span class="tg-setting-value">{{ representative.fullName }}</span>
        </div>

        <div class="tg-setting-item">
          <span class="tg-setting-label">Телефон</span>
          <span class="tg-setting-value">{{ representative.phone }}</span>
        </div>

        <div class="tg-setting-item">
          <span class="tg-setting-label">Организация</span>
          <span class="tg-setting-value">{{
            representative.organizationName
          }}</span>
        </div>

        <div class="tg-setting-item">
          <span class="tg-setting-label">Статус</span>
          <span
            class="tg-setting-value"
            :class="`tg-status-${representative.status}`"
          >
            {{ getStatusLabel(representative.status) }}
          </span>
        </div>

        <div v-if="representative.telegramUsername" class="tg-setting-item">
          <span class="tg-setting-label">Telegram</span>
          <span class="tg-setting-value"
            >@{{ representative.telegramUsername }}</span
          >
        </div>
      </div>
    </div>

    <!-- Права доступа -->
    <div class="tg-settings-section">
      <h3 class="tg-section-title">Права доступа</h3>

      <div class="tg-settings-card">
        <div class="tg-permission-item">
          <div
            class="tg-permission-icon"
            :class="{
              'tg-active': representative.permissions?.can_view_students,
            }"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
          </div>
          <span class="tg-permission-label">Просмотр слушателей</span>
          <div class="tg-permission-status">
            <svg
              v-if="representative.permissions?.can_view_students"
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <div class="tg-permission-item">
          <div
            class="tg-permission-icon"
            :class="{
              'tg-active': representative.permissions?.can_view_schedule,
            }"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <span class="tg-permission-label">Просмотр расписания</span>
          <div class="tg-permission-status">
            <svg
              v-if="representative.permissions?.can_view_schedule"
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>

        <div class="tg-permission-item">
          <div
            class="tg-permission-icon"
            :class="{
              'tg-active': representative.permissions?.can_view_certificates,
            }"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <span class="tg-permission-label">Просмотр сертификатов</span>
          <div class="tg-permission-status">
            <svg
              v-if="representative.permissions?.can_view_certificates"
              class="w-5 h-5 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <svg
              v-else
              class="w-5 h-5 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- О приложении -->
    <div class="tg-settings-section">
      <h3 class="tg-section-title">О приложении</h3>

      <div class="tg-settings-card">
        <div class="tg-about-item">
          <h4>АТЦ Платформа</h4>
          <p>Система управления учебным процессом</p>
        </div>

        <div class="tg-about-item">
          <span class="tg-about-label">Версия</span>
          <span class="tg-about-value">1.0.0</span>
        </div>

        <div class="tg-about-item">
          <span class="tg-about-label">Последнее обновление</span>
          <span class="tg-about-value">{{ formatDate(new Date()) }}</span>
        </div>
      </div>
    </div>

    <!-- Действия -->
    <div class="tg-settings-section">
      <button @click="handleRefresh" class="tg-action-btn primary">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <span>Обновить данные</span>
      </button>

      <button @click="handleSupport" class="tg-action-btn secondary">
        <svg
          class="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <span>Написать в поддержку</span>
      </button>
    </div>

    <!-- Копирайт -->
    <div class="tg-copyright">
      <p>© 2026 АТЦ Платформа</p>
      <p class="tg-copyright-sub">Все права защищены</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  representative: {
    type: Object,
    required: true,
  },
});

// Статус
function getStatusLabel(status) {
  const labels = {
    pending: "На рассмотрении",
    approved: "Активен",
    blocked: "Заблокирован",
  };
  return labels[status] || status;
}

// Форматирование даты
function formatDate(date) {
  return date.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// Обновить данные
function handleRefresh() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert("Обновление данных...", () => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

// Поддержка
function handleSupport() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink("https://t.me/support");
  }
}
</script>

<style scoped>
.tg-settings-tab {
  padding: 0;
}

/* Секция */
.tg-settings-section {
  margin-bottom: 1.5rem;
}

.tg-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.75rem 0.5rem;
}

/* Карточка */
.tg-settings-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

/* Элемент настройки */
.tg-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.tg-setting-item:last-child {
  border-bottom: none;
}

.tg-setting-label {
  font-size: 0.9375rem;
  color: #64748b;
}

.tg-setting-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
  text-align: right;
}

.tg-setting-value.tg-status-approved {
  color: #22c55e;
  background: #f0fdf4;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

.tg-setting-value.tg-status-pending {
  color: #d97706;
  background: #fffbeb;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

.tg-setting-value.tg-status-blocked {
  color: #dc2626;
  background: #fef2f2;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.8125rem;
}

/* Права */
.tg-permission-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.tg-permission-item:last-child {
  border-bottom: none;
}

.tg-permission-icon {
  width: 36px;
  height: 36px;
  background: #f1f5f9;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
}

.tg-permission-icon.tg-active {
  background: #eff6ff;
  color: #2563eb;
}

.tg-permission-label {
  flex: 1;
  font-size: 0.9375rem;
  color: #1e293b;
  font-weight: 500;
}

.tg-permission-status {
  display: flex;
  align-items: center;
}

.text-green-500 {
  color: #22c55e;
}

.text-red-500 {
  color: #ef4444;
}

/* О приложении */
.tg-about-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
}

.tg-about-item:last-child {
  border-bottom: none;
}

.tg-about-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.tg-about-item p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
}

.tg-about-item:not(:has(h4)) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tg-about-label {
  font-size: 0.9375rem;
  color: #64748b;
}

.tg-about-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
}

/* Действия */
.tg-action-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  border-radius: 12px;
  font-size: 0.9375rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.75rem;
}

.tg-action-btn.primary {
  background: #eff6ff;
  color: #2563eb;
  border: 1px solid #dbeafe;
}

.tg-action-btn.secondary {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.tg-action-btn:active {
  transform: scale(0.98);
}

.tg-action-btn:active.primary {
  background: #dbeafe;
}

.tg-action-btn:active.secondary {
  background: #f8fafc;
}

/* Копирайт */
.tg-copyright {
  text-align: center;
  padding: 2rem 1rem 1rem;
  color: #94a3b8;
}

.tg-copyright p {
  margin: 0;
  font-size: 0.875rem;
}

.tg-copyright-sub {
  font-size: 0.75rem;
  margin-top: 0.25rem !important;
  opacity: 0.8;
}
</style>
