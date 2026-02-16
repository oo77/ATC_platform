<template>
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4"
  >
    <div class="max-w-5xl mx-auto">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-gray-900 mb-3">
          ⚙️ Настройка окружения
        </h1>
        <p class="text-gray-600 text-lg">
          Конфигурация базы данных и параметров приложения
        </p>
      </div>

      <!-- Статус системы -->
      <div class="bg-white rounded-xl shadow-lg p-6 mb-6">
        <h2
          class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
        >
          <span>📊</span> Статус системы
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">{{ dbStatus.connected ? "✅" : "❌" }}</span>
            <div>
              <div class="text-sm text-gray-600">База данных</div>
              <div
                class="font-medium"
                :class="dbStatus.connected ? 'text-green-600' : 'text-red-600'"
              >
                {{ dbStatus.connected ? "Подключена" : "Не подключена" }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">{{ migrationsStatus }}</span>
            <div>
              <div class="text-sm text-gray-600">Миграции</div>
              <div class="font-medium text-gray-700">
                {{ migrationsText }}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <span class="text-2xl">🟢</span>
            <div>
              <div class="text-sm text-gray-600">Приложение</div>
              <div class="font-medium text-green-600">Запущено</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Форма настроек -->
      <form @submit.prevent="handleSaveAndRestart" class="space-y-6">
        <!-- База данных -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2
            class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span>🗄</span> База данных
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Хост
              </label>
              <input
                v-model="form.DATABASE_HOST"
                type="text"
                placeholder="localhost"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Порт
              </label>
              <input
                v-model="form.DATABASE_PORT"
                type="number"
                placeholder="3306"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Имя базы данных
              </label>
              <input
                v-model="form.DATABASE_NAME"
                type="text"
                placeholder="atc_platform"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Пользователь
              </label>
              <input
                v-model="form.DATABASE_USER"
                type="text"
                placeholder="root"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Пароль
              </label>
              <div class="relative">
                <input
                  v-model="form.DATABASE_PASSWORD"
                  :type="showPassword ? 'text' : 'password'"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  @click="showPassword = !showPassword"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {{ showPassword ? "🙈" : "👁" }}
                </button>
              </div>
            </div>
          </div>

          <!-- Результат проверки подключения -->
          <div
            v-if="connectionTest"
            class="mt-4 p-4 rounded-lg"
            :class="{
              'bg-green-50 border border-green-200': connectionTest.success,
              'bg-red-50 border border-red-200': !connectionTest.success,
            }"
          >
            <p
              :class="{
                'text-green-800': connectionTest.success,
                'text-red-800': !connectionTest.success,
              }"
            >
              {{ connectionTest.message }}
            </p>
            <p v-if="connectionTest.details" class="text-sm text-gray-600 mt-1">
              База: {{ connectionTest.details.database }} | Версия:
              {{ connectionTest.details.version }}
            </p>
          </div>

          <!-- Кнопки действий для БД -->
          <div class="flex gap-3 mt-4">
            <button
              type="button"
              @click="testConnection"
              :disabled="loading"
              class="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ loading ? "Проверка..." : "🔍 Проверить подключение" }}
            </button>

            <button
              type="button"
              @click="runMigrations"
              :disabled="loading || !connectionTest?.success"
              class="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {{ loading ? "Выполнение..." : "🚀 Запустить миграции" }}
            </button>
          </div>
        </div>

        <!-- Приложение -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2
            class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span>🌐</span> Приложение
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                URL приложения
              </label>
              <input
                v-model="form.APP_URL"
                type="url"
                placeholder="https://your-domain.com"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Название приложения
              </label>
              <input
                v-model="form.APP_NAME"
                type="text"
                placeholder="ATC Platform"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Часовой пояс
              </label>
              <select
                v-model="form.APP_TIMEZONE"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Asia/Almaty">Asia/Almaty (GMT+6)</option>
                <option value="Asia/Tashkent">Asia/Tashkent (GMT+5)</option>
                <option value="Asia/Bishkek">Asia/Bishkek (GMT+6)</option>
                <option value="Europe/Moscow">Europe/Moscow (GMT+3)</option>
                <option value="UTC">UTC (GMT+0)</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Telegram -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2
            class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span>📱</span> Telegram Bot
          </h2>

          <div class="grid grid-cols-1 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Bot Token
              </label>
              <input
                v-model="form.TELEGRAM_BOT_TOKEN"
                type="text"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p class="text-xs text-gray-500 mt-1">
                Получите токен у @BotFather в Telegram
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Webhook Secret
              </label>
              <input
                v-model="form.TELEGRAM_WEBHOOK_SECRET"
                type="text"
                placeholder="your_webhook_secret"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- OpenAI -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2
            class="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2"
          >
            <span>🤖</span> OpenAI / OpenRouter
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <input
                v-model="form.OPENAI_API_KEY"
                type="text"
                placeholder="sk-or-v1-..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Использовать OpenRouter
              </label>
              <select
                v-model="form.USE_OPENROUTER"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Да (рекомендуется)</option>
                <option value="false">Нет (OpenAI напрямую)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Vision Model
              </label>
              <input
                v-model="form.OPENAI_VISION_MODEL"
                type="text"
                placeholder="openai/gpt-4o"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Text Model
              </label>
              <input
                v-model="form.OPENAI_TEXT_MODEL"
                type="text"
                placeholder="openai/gpt-3.5-turbo"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <!-- Кнопка сохранения и перезапуска -->
        <div
          class="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg p-6"
        >
          <button
            type="submit"
            :disabled="loading"
            class="w-full px-8 py-4 bg-white text-blue-600 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-lg"
          >
            {{
              loading
                ? "Сохранение..."
                : "💾 Сохранить все настройки и перезапустить"
            }}
          </button>
          <p class="text-white text-sm text-center mt-3">
            Все изменения будут сохранены в .env файл и приложение
            перезапустится
          </p>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
// Отключаем layout для этой страницы
definePageMeta({
  layout: false,
});

// Состояние
const loading = ref(false);
const showPassword = ref(false);

const dbStatus = ref<{
  connected: boolean;
  message: string;
  error?: string;
}>({
  connected: false,
  message: "",
});

const connectionTest = ref<{
  success: boolean;
  message: string;
  details?: { database: string; version: string };
} | null>(null);

const migrationsStatus = ref("⏸");
const migrationsText = ref("Ожидание");

// Форма
const form = reactive({
  // Database
  DATABASE_HOST: "localhost",
  DATABASE_PORT: "3306",
  DATABASE_NAME: "atc_platform",
  DATABASE_USER: "root",
  DATABASE_PASSWORD: "",

  // Application
  APP_URL: "",
  APP_NAME: "ATC Platform",
  APP_TIMEZONE: "Asia/Almaty",

  // Telegram
  TELEGRAM_BOT_TOKEN: "",
  TELEGRAM_WEBHOOK_SECRET: "",

  // OpenAI
  OPENAI_API_KEY: "",
  USE_OPENROUTER: "true",
  OPENAI_VISION_MODEL: "openai/gpt-4o",
  OPENAI_TEXT_MODEL: "openai/gpt-3.5-turbo",
  OPENAI_MAX_TOKENS: "1500",
  OPENAI_TEMPERATURE: "0.1",
});

// Загрузка текущих настроек
onMounted(async () => {
  await checkDatabaseStatus();
  await loadCurrentSettings();
});

// Проверка статуса БД
const checkDatabaseStatus = async () => {
  try {
    const result = await $fetch<{
      connected: boolean;
      message: string;
      error?: string;
    }>("/api/environment/check-db");
    dbStatus.value = result;
  } catch (error: any) {
    dbStatus.value = {
      connected: false,
      message: error.data?.message || "Ошибка проверки",
    };
  }
};

// Загрузка текущих настроек
const loadCurrentSettings = async () => {
  try {
    const current = await $fetch("/api/environment/current");

    // Database
    if (current.database.DATABASE_HOST)
      form.DATABASE_HOST = current.database.DATABASE_HOST;
    if (current.database.DATABASE_PORT)
      form.DATABASE_PORT = current.database.DATABASE_PORT;
    if (current.database.DATABASE_NAME)
      form.DATABASE_NAME = current.database.DATABASE_NAME;
    if (current.database.DATABASE_USER)
      form.DATABASE_USER = current.database.DATABASE_USER;

    // Application
    if (current.application.APP_URL) form.APP_URL = current.application.APP_URL;
    if (current.application.APP_NAME)
      form.APP_NAME = current.application.APP_NAME;
    if (current.application.APP_TIMEZONE)
      form.APP_TIMEZONE = current.application.APP_TIMEZONE;

    // OpenAI
    if (current.openai.USE_OPENROUTER)
      form.USE_OPENROUTER = current.openai.USE_OPENROUTER;
    if (current.openai.OPENAI_VISION_MODEL)
      form.OPENAI_VISION_MODEL = current.openai.OPENAI_VISION_MODEL;
    if (current.openai.OPENAI_TEXT_MODEL)
      form.OPENAI_TEXT_MODEL = current.openai.OPENAI_TEXT_MODEL;
  } catch (error) {
    console.error("Failed to load current settings:", error);
  }
};

// Тестирование подключения
const testConnection = async () => {
  loading.value = true;
  connectionTest.value = null;

  try {
    const result = await $fetch("/api/environment/test-connection", {
      method: "POST",
      body: {
        DATABASE_HOST: form.DATABASE_HOST,
        DATABASE_PORT: form.DATABASE_PORT,
        DATABASE_NAME: form.DATABASE_NAME,
        DATABASE_USER: form.DATABASE_USER,
        DATABASE_PASSWORD: form.DATABASE_PASSWORD,
      },
    });

    connectionTest.value = {
      success: true,
      message: result.message,
      details: result.details || { database: "", version: "" },
    };

    migrationsStatus.value = "✅";
    migrationsText.value = "Готово к запуску";
  } catch (error: any) {
    connectionTest.value = {
      success: false,
      message: error.data?.message || error.message,
    };

    migrationsStatus.value = "❌";
    migrationsText.value = "Недоступно";
  } finally {
    loading.value = false;
  }
};

// Запуск миграций
const runMigrations = async () => {
  if (!connectionTest.value?.success) {
    alert("Сначала проверьте подключение к базе данных");
    return;
  }

  if (!confirm("Запустить миграции базы данных?")) {
    return;
  }

  loading.value = true;
  migrationsStatus.value = "⏳";
  migrationsText.value = "Выполнение...";

  try {
    await $fetch("/api/environment/migrate", {
      method: "POST",
    });

    migrationsStatus.value = "✅";
    migrationsText.value = "Выполнено";

    alert("✅ Миграции выполнены успешно!");
  } catch (error: any) {
    migrationsStatus.value = "❌";
    migrationsText.value = "Ошибка";

    alert(
      `❌ Ошибка выполнения миграций:\n${error.data?.message || error.message}`,
    );
  } finally {
    loading.value = false;
  }
};

// Сохранение и перезапуск
const handleSaveAndRestart = async () => {
  if (!confirm("Сохранить все настройки и перезапустить приложение?")) {
    return;
  }

  loading.value = true;

  try {
    // Сохраняем настройки
    await $fetch("/api/environment/save", {
      method: "POST",
      body: form,
    });

    alert("✅ Настройки сохранены!");

    // Перезапускаем приложение
    try {
      await $fetch("/api/environment/restart", {
        method: "POST",
      });

      alert(
        "🔄 Приложение перезапускается...\n\nСтраница обновится через 5 секунд.",
      );

      // Ждём 5 секунд и перезагружаем страницу
      setTimeout(() => {
        window.location.href = "/";
      }, 5000);
    } catch (restartError: any) {
      // Если автоматический перезапуск не удался
      alert(
        `⚠️ ${restartError.data?.message || "Не удалось автоматически перезапустить"}\n\n${restartError.data?.instruction || "Перезапустите приложение вручную через cPanel"}`,
      );
    }
  } catch (error: any) {
    alert(`❌ Ошибка сохранения:\n${error.data?.message || error.message}`);
  } finally {
    loading.value = false;
  }
};
</script>
