<template>
  <div class="tg-app-root">
    <!-- Загрузка -->
    <div v-if="loading" class="tg-loading">
      <div class="tg-spinner"></div>
      <p>Загрузка...</p>
    </div>

    <!-- Ошибка авторизации -->
    <div v-else-if="authError" class="tg-auth-error">
      <div class="tg-error-icon">⚠️</div>
      <h2>Ошибка авторизации</h2>
      <p>{{ authError }}</p>

      <div class="tg-debug-info" v-if="showDebug">
        <h3>Отладочная информация:</h3>
        <pre>{{ debugData }}</pre>

        <!-- Ручной ввод ID для теста -->
        <div class="tg-manual-auth">
          <h3>Ручной тест (если данных нет):</h3>
          <input
            v-model="manualUserId"
            type="text"
            placeholder="Введите Telegram ID (напр. 123456)"
            class="tg-input-debug"
          />
          <button @click="manualAuth" class="tg-btn-primary tg-btn-small">
            Войти вручную
          </button>
        </div>
      </div>

      <div class="tg-actions">
        <button @click="retryAuth" class="tg-btn-primary">
          Попробовать снова
        </button>
        <button @click="showDebug = !showDebug" class="tg-btn-secondary">
          {{ showDebug ? "Скрыть детали" : "Показать детали" }}
        </button>
      </div>
    </div>

    <!-- Регистрация -->
    <div v-else-if="!representative" class="tg-registration">
      <div class="tg-welcome">
        <div class="tg-logo">
          <img src="/logo.png" alt="АТЦ" />
        </div>
        <h1>Добро пожаловать!</h1>
        <p>
          Пожалуйста, пройдите регистрацию для доступа к информации о слушателях
        </p>
      </div>

      <RegistrationForm
        :telegram-data="telegramData"
        @registered="handleRegistered"
      />
    </div>

    <!-- Основное приложение -->
    <div v-else class="tg-main-app">
      <!-- Заголовок -->
      <header class="tg-header">
        <div class="tg-header-content">
          <div class="tg-user-info">
            <div class="tg-avatar">
              {{ getInitials(representative.fullName) }}
            </div>
            <div class="tg-user-details">
              <h3>{{ representative.fullName }}</h3>
              <p>{{ representative.organizationName }}</p>
            </div>
          </div>
          <div class="tg-status" :class="`tg-status-${representative.status}`">
            {{ getStatusLabel(representative.status) }}
          </div>
        </div>
      </header>

      <!-- Проверка статуса -->
      <div v-if="representative.status === 'pending'" class="tg-pending-notice">
        <div class="tg-notice-icon">⏳</div>
        <h3>Ожидает одобрения</h3>
        <p>
          Ваша заявка находится на рассмотрении у администратора. Вы получите
          уведомление после одобрения.
        </p>
      </div>

      <div
        v-else-if="representative.status === 'blocked'"
        class="tg-blocked-notice"
      >
        <div class="tg-notice-icon">🚫</div>
        <h3>Доступ заблокирован</h3>
        <p>{{ representative.blockedReason || "Причина не указана" }}</p>
        <p class="tg-blocked-hint">
          Обратитесь к администратору учебного центра для решения вопроса.
        </p>
      </div>

      <!-- Основное содержимое для одобренных -->
      <div v-else-if="representative.status === 'approved'" class="tg-content">
        <!-- Навигация -->
        <nav class="tg-nav">
          <button
            v-for="tab in availableTabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="['tg-nav-btn', { active: activeTab === tab.id }]"
          >
            <span class="tg-nav-icon">{{ tab.icon }}</span>
            <span class="tg-nav-label">{{ tab.label }}</span>
          </button>
        </nav>

        <!-- Контент вкладок -->
        <div class="tg-tab-content">
          <!-- Слушатели -->
          <StudentsTab
            v-if="activeTab === 'students'"
            :organization-id="representative.organizationId"
            :permissions="representative.permissions"
          />

          <!-- Расписание -->
          <ScheduleTab
            v-if="activeTab === 'schedule'"
            :organization-id="representative.organizationId"
            :permissions="representative.permissions"
          />

          <!-- Сертификаты -->
          <CertificatesTab
            v-if="activeTab === 'certificates'"
            :organization-id="representative.organizationId"
            :permissions="representative.permissions"
          />

          <!-- Настройки -->
          <SettingsTab
            v-if="activeTab === 'settings'"
            :representative="representative"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import RegistrationForm from "~/components/tg-app/RegistrationForm.vue";
import StudentsTab from "~/components/tg-app/StudentsTab.vue";
import ScheduleTab from "~/components/tg-app/ScheduleTab.vue";
import CertificatesTab from "~/components/tg-app/CertificatesTab.vue";
import SettingsTab from "~/components/tg-app/SettingsTab.vue";

// Определение мета-данных для SEO
definePageMeta({
  layout: false, // Убираем стандартный layout для Telegram Mini App
});

// Состояние
const loading = ref(true);
const authError = ref(null);
const telegramData = ref(null);
const representative = ref(null);
const activeTab = ref("students");
const debugData = ref("{}");
const showDebug = ref(false);

// Доступные вкладки в зависимости от прав
const availableTabs = computed(() => {
  if (!representative.value) return [];

  const tabs = [];

  if (representative.value.permissions?.can_view_students) {
    tabs.push({ id: "students", icon: "👥", label: "Слушатели" });
  }

  if (representative.value.permissions?.can_view_schedule) {
    tabs.push({ id: "schedule", icon: "📅", label: "Расписание" });
  }

  if (representative.value.permissions?.can_view_certificates) {
    tabs.push({ id: "certificates", icon: "📜", label: "Сертификаты" });
  }

  tabs.push({ id: "settings", icon: "⚙️", label: "Настройки" });

  return tabs;
});

// Получить инициалы
function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return fullName[0];
}

// Получить метку статуса
function getStatusLabel(status) {
  const labels = {
    pending: "⏳ На рассмотрении",
    approved: "✅ Одобрен",
    blocked: "🚫 Заблокирован",
  };
  return labels[status] || status;
}

// Инициализация Telegram Web App
async function initTelegramWebApp() {
  try {
    // 1. Проверяем наличие SDK
    if (typeof window.Telegram === "undefined" || !window.Telegram.WebApp) {
      if (import.meta.env.DEV) {
        console.warn(
          "[DEV MODE] Telegram SDK не найден. Используем полный мок.",
        );
        useDevMock();
        return;
      }
      throw new Error("Запустите приложение через Telegram (SDK not found)");
    }

    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.enableClosingConfirmation();

    // Сохраняем отладочную инфу
    debugData.value = JSON.stringify(
      {
        version: tg.version,
        platform: tg.platform,
        initData: tg.initData,
        initDataUnsafe: tg.initDataUnsafe,
      },
      null,
      2,
    );

    // 2. Получаем initData
    const rawInitData = tg.initData;
    const unsafeUser = tg.initDataUnsafe?.user;

    // 3. Логика для Разработки (Localhost)
    if (import.meta.env.DEV) {
      // Если данных нет (открыли localhost в браузере) - используем мок
      if (!rawInitData || !unsafeUser) {
        console.log("[DEV MODE] Данных Telegram нет. Активируем DEV MOCK.");
        telegramData.value = {
          initData: "dev_mode", // Специальный ключ для сервера
          user: {
            id: 123456789,
            first_name: "Dev",
            last_name: "User",
            username: "dev_admin",
          },
        };
      } else {
        // Если каким-то чудом данные есть (например, через ngrok внутри TG)
        console.log("[DEV MODE] Обнаружены данные Telegram.");
        telegramData.value = {
          initData: rawInitData,
          user: unsafeUser,
        };
      }
    }
    // 4. Логика для Продакшена
    else {
      if (!rawInitData || !unsafeUser) {
        // В продакшене без данных жить нельзя
        console.error("initData пуста:", tg);
        throw new Error(
          "Ошибка инициализации: данные пользователя не получены. Попробуйте перезапустить бота.",
        );
      }

      telegramData.value = {
        initData: rawInitData,
        user: unsafeUser,
      };
    }

    // Проверяем авторизацию
    if (telegramData.value) {
      await checkAuth();
    }
  } catch (error) {
    console.error("Ошибка инициализации:", error);
    authError.value = error.message;
  } finally {
    loading.value = false;
  }
}

// Хелпер для полного мока (если window.Telegram нет)
function useDevMock() {
  telegramData.value = {
    initData: "dev_mode",
    user: {
      id: 123456789,
      first_name: "Dev",
      last_name: "User",
      username: "dev_admin",
    },
  };
  checkAuth().finally(() => (loading.value = false));
}

// Проверка авторизации
async function checkAuth() {
  try {
    console.log("[TG-App Client] Начало проверки авторизации");
    console.log("[TG-App Client] initData:", telegramData.value?.initData);

    const response = await $fetch("/api/tg-app/auth", {
      method: "POST",
      body: {
        initData: telegramData.value.initData,
        user: telegramData.value.user, // Явно передаем объект пользователя
      },
    });

    console.log("[TG-App Client] Ответ от сервера:", response);

    if (response.representative) {
      representative.value = response.representative;
      console.log(
        "[TG-App Client] Представитель установлен:",
        representative.value.fullName,
      );
    }
  } catch (error) {
    console.error("[TG-App Client] Ошибка авторизации:", error);
    console.error("[TG-App Client] Детали ошибки:", {
      statusCode: error.statusCode,
      message: error.message,
      data: error.data,
    });

    // Если пользователь не найден, покажем форму регистрации
    if (error.statusCode === 404) {
      console.log(
        "[TG-App Client] Пользователь не найден, показываем форму регистрации",
      );
      // Ничего не делаем, покажется форма регистрации
    } else {
      throw error;
    }
  }
}

// Повторная попытка авторизации
function retryAuth() {
  authError.value = null;
  loading.value = true;
  initTelegramWebApp();
}

// Ручная авторизация (для тестов)
const manualUserId = ref("");

async function manualAuth() {
  if (!manualUserId.value) {
    alert("Введите ID");
    return;
  }

  // Формируем фейковые данные
  telegramData.value = {
    initData: `user={"id":${manualUserId.value},"first_name":"Test","last_name":"User","username":"testuser"}`,
    user: {
      id: Number(manualUserId.value),
      first_name: "Test",
      last_name: "User (" + manualUserId.value + ")",
      username: "testuser",
    },
  };

  authError.value = null;
  loading.value = true;

  await checkAuth();
  loading.value = false;
}

// Обработка успешной регистрации
function handleRegistered(data) {
  representative.value = data.representative;
}

// Подключение скрипта Telegram Web App
onMounted(() => {
  // Добавляем скрипт Telegram Web App SDK
  const script = document.createElement("script");
  script.src = "https://telegram.org/js/telegram-web-app.js";
  script.async = true;
  script.onload = () => {
    // Даём время на инициализацию
    setTimeout(initTelegramWebApp, 100);
  };
  script.onerror = () => {
    authError.value = "Не удалось загрузить Telegram Web App SDK";
    loading.value = false;
  };
  document.head.appendChild(script);
});
</script>

<style scoped>
/* Корневой контейнер */
.tg-app-root {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #f1f5f9;
  font-family:
    -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu,
    Cantarell, sans-serif;
  overflow-x: hidden;
}

/* Загрузка */
.tg-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  gap: 1.5rem;
}

.tg-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}

/* Ошибка */
.tg-auth-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
}

.tg-error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.tg-auth-error h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #fbbf24;
}

.tg-auth-error p {
  color: #94a3b8;
  margin-bottom: 2rem;
}

.tg-debug-info {
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 2rem;
  max-width: 100%;
  overflow-x: auto;
  text-align: left;
}

.tg-debug-info pre {
  font-family: monospace;
  font-size: 0.75rem;
  color: #fca5a5;
  white-space: pre-wrap;
  word-break: break-all;
}

.tg-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 300px;
}

.tg-btn-secondary {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-manual-auth {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.tg-manual-auth h3 {
  font-size: 0.9rem;
  color: #94a3b8;
  margin-bottom: 0.5rem;
}

.tg-input-debug {
  width: 100%;
  padding: 0.5rem;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  margin-bottom: 0.5rem;
}

.tg-btn-small {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  width: 100%;
}

/* Регистрация */
.tg-registration {
  min-height: 100vh;
  padding: 2rem 1rem;
}

.tg-welcome {
  text-align: center;
  margin-bottom: 2rem;
}

.tg-logo {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10px 30px rgba(59, 130, 246, 0.3);
}

.tg-logo img {
  width: 50px;
  height: 50px;
  object-fit: contain;
}

.tg-welcome h1 {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tg-welcome p {
  color: #94a3b8;
  line-height: 1.6;
}

/* Основное приложение */
.tg-main-app {
  min-height: 100vh;
}

/* Заголовок */
.tg-header {
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.tg-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 600px;
  margin: 0 auto;
}

.tg-user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
  color: white;
}

.tg-user-details h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: #f1f5f9;
}

.tg-user-details p {
  font-size: 0.875rem;
  margin: 0;
  color: #94a3b8;
}

.tg-status {
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tg-status-approved {
  background: rgba(34, 197, 94, 0.2);
  color: #4ade80;
}

.tg-status-pending {
  background: rgba(251, 191, 36, 0.2);
  color: #fbbf24;
}

.tg-status-blocked {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

/* Уведомления */
.tg-pending-notice,
.tg-blocked-notice {
  max-width: 600px;
  margin: 2rem auto;
  padding: 1.5rem;
  border-radius: 16px;
  text-align: center;
}

.tg-pending-notice {
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
}

.tg-blocked-notice {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.tg-notice-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.tg-pending-notice h3,
.tg-blocked-notice h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.tg-pending-notice p,
.tg-blocked-notice p {
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 0;
}

.tg-blocked-hint {
  margin-top: 1rem !important;
  font-size: 0.875rem;
  font-style: italic;
}

/* Контент */
.tg-content {
  max-width: 600px;
  margin: 0 auto;
  padding-bottom: 80px; /* Место для навигации */
}

/* Навигация */
.tg-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
  gap: 0.5rem;
  z-index: 100;
}

.tg-nav-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 12px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-nav-btn:active {
  transform: scale(0.95);
}

.tg-nav-btn.active {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
}

.tg-nav-icon {
  font-size: 1.5rem;
}

.tg-nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Кнопки */
.tg-btn-primary {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tg-btn-primary:hover {
  box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
  transform: translateY(-2px);
}

.tg-btn-primary:active {
  transform: translateY(0);
}

/* Вкладки */
.tg-tab-content {
  padding: 1rem;
}
</style>
