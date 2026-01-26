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
          <span class="tg-setting-value">{{ representative.organizationName }}</span>
        </div>

        <div class="tg-setting-item">
          <span class="tg-setting-label">Статус</span>
          <span class="tg-setting-value" :class="`tg-status-${representative.status}`">
            {{ getStatusLabel(representative.status) }}
          </span>
        </div>

        <div v-if="representative.telegramUsername" class="tg-setting-item">
          <span class="tg-setting-label">Telegram</span>
          <span class="tg-setting-value">@{{ representative.telegramUsername }}</span>
        </div>
      </div>
    </div>

    <!-- Права доступа -->
    <div class="tg-settings-section">
      <h3 class="tg-section-title">Права доступа</h3>
      
      <div class="tg-settings-card">
        <div class="tg-permission-item">
          <span class="tg-permission-icon">
            {{ representative.permissions?.can_view_students ? '✅' : '❌' }}
          </span>
          <span class="tg-permission-label">Просмотр слушателей</span>
        </div>

        <div class="tg-permission-item">
          <span class="tg-permission-icon">
            {{ representative.permissions?.can_view_schedule ? '✅' : '❌' }}
          </span>
          <span class="tg-permission-label">Просмотр расписания</span>
        </div>

        <div class="tg-permission-item">
          <span class="tg-permission-icon">
            {{ representative.permissions?.can_view_certificates ? '✅' : '❌' }}
          </span>
          <span class="tg-permission-label">Просмотр сертификатов</span>
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
      <button @click="handleRefresh" class="tg-action-btn">
        <span>🔄</span>
        <span>Обновить данные</span>
      </button>

      <button @click="handleSupport" class="tg-action-btn">
        <span>💬</span>
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
    pending: '⏳ На рассмотрении',
    approved: '✅ Одобрен',
    blocked: '🚫 Заблокирован',
  };
  return labels[status] || status;
}

// Форматирование даты
function formatDate(date) {
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

// Обновить данные
function handleRefresh() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert('Обновление данных...', () => {
      window.location.reload();
    });
  } else {
    window.location.reload();
  }
}

// Поддержка
function handleSupport() {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.openTelegramLink('https://t.me/support');
  }
}
</script>

<style scoped>
.tg-settings-tab {
  padding: 1rem 0;
}

/* Секция */
.tg-settings-section {
  margin-bottom: 1.5rem;
}

.tg-section-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0 0 0.75rem 0.5rem;
}

/* Карточка */
.tg-settings-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  padding: 1rem;
}

/* Элемент настройки */
.tg-setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tg-setting-item:last-child {
  border-bottom: none;
}

.tg-setting-label {
  font-size: 0.9375rem;
  color: #94a3b8;
}

.tg-setting-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #f1f5f9;
  text-align: right;
}

.tg-setting-value.tg-status-approved {
  color: #4ade80;
}

.tg-setting-value.tg-status-pending {
  color: #fbbf24;
}

.tg-setting-value.tg-status-blocked {
  color: #f87171;
}

/* Права */
.tg-permission-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tg-permission-item:last-child {
  border-bottom: none;
}

.tg-permission-icon {
  font-size: 1.25rem;
}

.tg-permission-label {
  flex: 1;
  font-size: 0.9375rem;
  color: #f1f5f9;
}

/* О приложении */
.tg-about-item {
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.tg-about-item:last-child {
  border-bottom: none;
}

.tg-about-item h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0 0 0.25rem 0;
}

.tg-about-item p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

.tg-about-item:not(:has(h4)) {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tg-about-label {
  font-size: 0.9375rem;
  color: #94a3b8;
}

.tg-about-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #f1f5f9;
}

/* Действия */
.tg-action-btn {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 0.9375rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 0.75rem;
}

.tg-action-btn:active {
  background: rgba(30, 41, 59, 0.6);
  transform: scale(0.99);
}

.tg-action-btn span:first-child {
  font-size: 1.25rem;
}

/* Копирайт */
.tg-copyright {
  text-align: center;
  padding: 2rem 1rem 1rem;
  color: #64748b;
}

.tg-copyright p {
  margin: 0;
  font-size: 0.875rem;
}

.tg-copyright-sub {
  font-size: 0.75rem;
  margin-top: 0.25rem !important;
}
</style>
