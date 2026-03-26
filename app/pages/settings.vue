<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-black dark:text-white">Настройки</h2>
      <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
        Управление системой, профилем и конфигурацией платформы
      </p>
    </div>

    <!-- Основной layout: Сайдбар с карточками навигации + контент -->
    <div class="flex gap-6 items-start">

      <!-- ===== ЛЕВАЯ НАВИГАЦИЯ (карточки) ===== -->
      <div class="w-72 shrink-0 space-y-2">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          @click="activeTab = tab.id"
          class="group w-full rounded-xl border p-4 text-left transition-all duration-200"
          :class="activeTab === tab.id
            ? 'border-primary bg-primary text-white shadow-lg shadow-primary/20 scale-[1.01]'
            : 'border-gray-200 bg-white text-gray-700 hover:border-primary/30 hover:bg-gray-50 dark:border-gray-700 dark:bg-boxdark dark:text-gray-300 dark:hover:bg-gray-800'"
        >
          <div class="flex items-center gap-3">
            <div
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-all"
              :class="activeTab === tab.id
                ? 'bg-white/20 text-white'
                : 'text-primary ' + tab.bgClass"
            >
              <component :is="tab.icon" class="h-5 w-5" />
            </div>
            <div class="min-w-0">
              <p class="font-semibold text-sm leading-tight" :class="activeTab === tab.id ? 'text-white' : ''">
                {{ tab.label }}
              </p>
              <p class="text-[11px] mt-0.5 leading-tight truncate"
                :class="activeTab === tab.id ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'"
              >
                {{ tab.description }}
              </p>
            </div>
            <ChevronRight
              class="ml-auto h-4 w-4 shrink-0 transition-transform"
              :class="activeTab === tab.id ? 'text-white rotate-90 opacity-100' : 'text-gray-300 group-hover:text-primary opacity-50 group-hover:opacity-100'"
            />
          </div>
        </button>
      </div>

      <!-- ===== ПРАВАЯ ЧАСТЬ (контент) ===== -->
      <div class="flex-1 min-w-0">

        <!-- ПРОФИЛЬ / ОБЩИЕ -->
        <div v-if="activeTab === 'general'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Общие настройки</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Язык и базовые параметры интерфейса</p>
            </div>
            <div class="p-6 space-y-4">
              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Язык интерфейса</label>
                <select v-model="userForm.language"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                  <option value="ru">Русский</option>
                  <option value="en">English</option>
                  <option value="uz">O'zbek</option>
                </select>
              </div>

              <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 opacity-60">
                <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Часовой пояс (недоступно)</label>
                <select disabled class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                  <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                </select>
              </div>

              <!-- APP_URL и APP_NAME из .env -->
              <div class="border-t border-gray-100 dark:border-gray-700 pt-4">
                <p class="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Параметры приложения (.env)</p>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Название (APP_NAME)</label>
                    <input v-model="envForm.APP_NAME" type="text" placeholder="ATC Platform"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">URL сервера (APP_URL)</label>
                    <input v-model="envForm.APP_URL" type="url" placeholder="https://..."
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                  </div>
                </div>
              </div>

              <div class="flex justify-end gap-3 pt-2">
                <UiButton variant="primary" :loading="saving" @click="saveAll('general')">
                  Сохранить
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- УВЕДОМЛЕНИЯ -->
        <div v-if="activeTab === 'notifications'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Настройки уведомлений</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Каналы получения уведомлений</p>
            </div>
            <div class="p-6 space-y-3">
              <div v-for="notif in notificationOptions" :key="notif.key"
                class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-white">{{ notif.label }}</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{{ notif.description }}</p>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" v-model="userForm[notif.key]" class="peer sr-only" />
                  <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                </label>
              </div>
              <div class="flex justify-end pt-2">
                <UiButton variant="primary" :loading="saving" @click="saveAll('user')">Сохранить</UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- ВНЕШНИЙ ВИД -->
        <div v-if="activeTab === 'appearance'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Внешний вид</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Тема, шрифт и цветовая схема</p>
            </div>
            <div class="p-6 space-y-6">
              <!-- Тема -->
              <div>
                <label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Тема оформления</label>
                <div class="grid grid-cols-3 gap-3">
                  <label v-for="theme in themes" :key="theme.value"
                    class="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 bg-white p-4 transition-all hover:border-primary dark:bg-gray-900"
                    :class="userForm.theme === theme.value ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'">
                    <input type="radio" v-model="userForm.theme" :value="theme.value" class="sr-only" />
                    <div class="flex h-12 w-12 items-center justify-center rounded-lg" :class="theme.bgClass">
                      <component :is="theme.icon" class="h-6 w-6" :class="theme.iconClass" />
                    </div>
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ theme.label }}</span>
                  </label>
                </div>
              </div>

              <!-- Размер шрифта -->
              <div>
                <label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Размер шрифта</label>
                <div class="flex gap-3">
                  <label v-for="size in fontSizes" :key="size.value"
                    class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary dark:bg-gray-900"
                    :class="userForm.font_size === size.value ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'">
                    <input type="radio" v-model="userForm.font_size" :value="size.value" class="sr-only" />
                    <span class="font-medium text-gray-700 dark:text-gray-300" :class="size.textClass">{{ size.label }}</span>
                  </label>
                </div>
              </div>

              <div class="flex justify-end">
                <UiButton variant="primary" :loading="saving" @click="saveAll('user')">Применить</UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- РАСПИСАНИЕ -->
        <div v-if="activeTab === 'schedule'">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Настройки расписания</h3>
            </div>
            <div class="p-6"><SettingsScheduleSettings /></div>
          </div>
        </div>

        <!-- АУДИТОРИИ -->
        <div v-if="activeTab === 'classrooms'">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Аудитории</h3>
            </div>
            <div class="p-6"><SettingsClassroomSettings /></div>
          </div>
        </div>

        <!-- AI НАСТРОЙКИ (логика не меняется) -->
        <div v-if="activeTab === 'ai'">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">AI Настройки</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Управление API ключами и провайдерами</p>
            </div>
            <div class="p-6"><SettingsAISettings /></div>
          </div>
        </div>

        <!-- TELEGRAM -->
        <div v-if="activeTab === 'telegram'" class="space-y-6">
          <!-- .env токены для Telegram -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">Конфигурация бота (.env)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Токены и секреты для Telegram Bot API</p>
              </div>
              <div v-if="envLoading" class="h-5 w-5 animate-spin rounded-full border-2 border-solid border-primary border-t-transparent"></div>
            </div>
            <div class="p-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bot Token <span class="text-danger">*</span>
                  </label>
                  <div class="relative">
                    <input v-model="envForm.TELEGRAM_BOT_TOKEN"
                      :type="visibleSecrets.TELEGRAM_BOT_TOKEN ? 'text' : 'password'"
                      placeholder="Получить у @BotFather"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    <button type="button" @click="toggleSecret('TELEGRAM_BOT_TOKEN')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <Eye v-if="!visibleSecrets.TELEGRAM_BOT_TOKEN" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                  <p class="mt-1 text-[11px] text-gray-400">Формат: 1234567890:ABCdef...</p>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Webhook Secret <span class="text-danger">*</span>
                  </label>
                  <div class="relative">
                    <input v-model="envForm.TELEGRAM_WEBHOOK_SECRET"
                      :type="visibleSecrets.TELEGRAM_WEBHOOK_SECRET ? 'text' : 'password'"
                      placeholder="Придумайте секретную строку"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    <button type="button" @click="toggleSecret('TELEGRAM_WEBHOOK_SECRET')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <Eye v-if="!visibleSecrets.TELEGRAM_WEBHOOK_SECRET" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                  <p class="mt-1 text-[11px] text-gray-400">Секрет для верификации запросов от Telegram</p>
                </div>
              </div>
              <div class="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <UiButton variant="primary" :loading="saving" @click="saveEnvGroup(['TELEGRAM_BOT_TOKEN', 'TELEGRAM_WEBHOOK_SECRET'])">
                  <Save class="mr-2 h-4 w-4" />
                  Сохранить токены в .env
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Управление ботом (компонент без изменений) -->
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Управление ботом</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Webhook, статус и возможности бота</p>
            </div>
            <div class="p-6"><SettingsTelegramBotSettings /></div>
          </div>
        </div>

        <!-- БАЗА ДАННЫХ -->
        <div v-if="activeTab === 'database'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">База данных (.env)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">Параметры подключения к MySQL</p>
              </div>
              <!-- Индикатор статуса -->
              <div class="flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
                :class="dbStatus.connected ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'">
                <div class="h-2 w-2 rounded-full" :class="dbStatus.connected ? 'bg-success' : 'bg-danger'"></div>
                {{ dbStatus.connected ? 'Подключена' : 'Не подключена' }}
              </div>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Хост <span class="text-danger">*</span></label>
                  <input v-model="envForm.DATABASE_HOST" type="text" placeholder="localhost"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Порт</label>
                  <input v-model="envForm.DATABASE_PORT" type="text" placeholder="3306"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Имя БД <span class="text-danger">*</span></label>
                  <input v-model="envForm.DATABASE_NAME" type="text" placeholder="atc_platform"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Пользователь <span class="text-danger">*</span></label>
                  <input v-model="envForm.DATABASE_USER" type="text" placeholder="root"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
                <div class="md:col-span-2">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Пароль</label>
                  <div class="relative">
                    <input v-model="envForm.DATABASE_PASSWORD"
                      :type="visibleSecrets.DATABASE_PASSWORD ? 'text' : 'password'"
                      placeholder="Оставьте пустым чтобы не менять"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    <button type="button" @click="toggleSecret('DATABASE_PASSWORD')" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <Eye v-if="!visibleSecrets.DATABASE_PASSWORD" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div class="flex gap-3 pt-2 border-t border-gray-100 dark:border-gray-700 mt-4">
                <UiButton variant="outline" :loading="testingDb" @click="testDbConnection">
                  Проверить подключение
                </UiButton>
                <UiButton variant="primary" :loading="saving" @click="saveEnvGroup(['DATABASE_HOST','DATABASE_PORT','DATABASE_NAME','DATABASE_USER','DATABASE_PASSWORD'])">
                  <Save class="mr-2 h-4 w-4" />
                  Сохранить в .env
                </UiButton>
              </div>

              <!-- Результат теста -->
              <div v-if="connectionTest" class="rounded-lg p-3 text-sm"
                :class="connectionTest.success ? 'bg-success/10 border border-success/20 text-success' : 'bg-danger/10 border border-danger/20 text-danger'">
                {{ connectionTest.message }}
              </div>
            </div>
          </div>
        </div>

        <!-- БЕЗОПАСНОСТЬ -->
        <div v-if="activeTab === 'security'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30">
              <h3 class="font-bold text-gray-900 dark:text-white">Безопасность и JWT (.env)</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">Секреты токенов авторизации</p>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div v-for="field in securityFields" :key="field.key">
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {{ field.label }} <span class="text-danger">*</span>
                  </label>
                  <div v-if="field.isSecret" class="relative">
                    <input v-model="envForm[field.key]"
                      :type="visibleSecrets[field.key] ? 'text' : 'password'"
                      :placeholder="field.placeholder"
                      class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                    <button type="button" @click="toggleSecret(field.key)" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      <Eye v-if="!visibleSecrets[field.key]" class="h-4 w-4" />
                      <EyeOff v-else class="h-4 w-4" />
                    </button>
                  </div>
                  <input v-else v-model="envForm[field.key]" type="text" :placeholder="field.placeholder"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
                </div>
              </div>
              <div class="flex justify-end pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                <UiButton variant="primary" :loading="saving" @click="saveEnvGroup(['JWT_SECRET','JWT_EXPIRES_IN','REFRESH_TOKEN_SECRET','REFRESH_TOKEN_EXPIRES_IN'])">
                  <Save class="mr-2 h-4 w-4" />
                  Сохранить в .env
                </UiButton>
              </div>
            </div>
          </div>
        </div>

        <!-- СЕРВЕР И СИСТЕМА -->
        <div v-if="activeTab === 'system'" class="space-y-6">
          <div class="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-boxdark overflow-hidden">
            <div class="border-b border-gray-100 dark:border-gray-700 px-6 py-4 bg-gray-50/50 dark:bg-gray-800/30 flex items-center justify-between">
              <div>
                <h3 class="font-bold text-gray-900 dark:text-white">Система (.env)</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">NODE_ENV и параметры автозапуска</p>
              </div>
            </div>
            <div class="p-6 space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Режим NODE_ENV</label>
                  <select v-model="envForm.NODE_ENV"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                    <option value="production">production</option>
                    <option value="development">development</option>
                  </select>
                </div>
                <div>
                  <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Часовой пояс (APP_TIMEZONE)</label>
                  <select v-model="envForm.APP_TIMEZONE"
                    class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                    <option value="Asia/Almaty">Asia/Almaty (UTC+6)</option>
                    <option value="Europe/Moscow">Europe/Moscow (UTC+3)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>
              </div>

              <div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
                <input id="auto-migrate" v-model="envFormBool.AUTO_MIGRATE" type="checkbox"
                  class="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" />
                <label for="auto-migrate" class="cursor-pointer">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Авто-миграции при запуске</span>
                  <p class="text-xs text-gray-500">AUTO_MIGRATE=true — запускать миграции БД при старте приложения</p>
                </label>
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700 mt-2">
                <UiButton variant="primary" :loading="saving" @click="saveEnvGroup(['NODE_ENV','APP_TIMEZONE','AUTO_MIGRATE'])">
                  <Save class="mr-2 h-4 w-4" />
                  Сохранить в .env
                </UiButton>
                <UiButton variant="danger" :loading="restarting" @click="showRestartConfirm = true">
                  <Power class="mr-2 h-4 w-4" />
                  Перезагрузить сервер
                </UiButton>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Модалка подтверждения перезапуска -->
    <UiConfirmModal
      :is-open="showRestartConfirm"
      title="Перезапустить сервер?"
      message="Приложение будет недоступно несколько секунд. Все несохранённые данные будут потеряны."
      confirm-text="Перезапустить"
      cancel-text="Отмена"
      @confirm="executeRestart"
      @close="showRestartConfirm = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import {
  Settings, Bell, Palette, Calendar, DoorOpen, Bot,
  MessageSquareText, Database, ShieldCheck, Server,
  ChevronRight, Eye, EyeOff, Save, Power, Sun, Moon, SunMoon
} from 'lucide-vue-next';
import { useUserSettings } from '@/composables/useUserSettings';
import { Permission, roleHasPermission } from '~/types/permissions';

definePageMeta({ layout: 'default' });
useHead({ title: 'Настройки | ATC Platform' });

// ============================================================================
// USER SETTINGS
// ============================================================================
const { settings, loading, fetchSettings, updateSettings } = useUserSettings();
const { user } = useAuth();
const { show: showNotification } = useNotification();

const userForm = ref({
  theme: 'light',
  language: 'ru',
  notifications_email: true,
  notifications_push: true,
  notifications_sms: false,
  compact_mode: false,
  font_size: 'medium',
  sidebar_color: 'default',
});

watch(settings, (s) => { if (s) userForm.value = { ...s }; }, { immediate: true });

// ============================================================================
// ENV SETTINGS
// ============================================================================
const envLoading = ref(false);
const saving = ref(false);
const testingDb = ref(false);
const restarting = ref(false);
const showRestartConfirm = ref(false);
const connectionTest = ref<{ success: boolean; message: string } | null>(null);

const envForm = reactive<Record<string, string>>({
  APP_NAME: '', APP_URL: '', APP_TIMEZONE: 'Asia/Tashkent', NODE_ENV: 'production',
  DATABASE_HOST: '', DATABASE_PORT: '3306', DATABASE_NAME: '', DATABASE_USER: '', DATABASE_PASSWORD: '',
  JWT_SECRET: '', JWT_EXPIRES_IN: '7d', REFRESH_TOKEN_SECRET: '', REFRESH_TOKEN_EXPIRES_IN: '30d',
  TELEGRAM_BOT_TOKEN: '', TELEGRAM_WEBHOOK_SECRET: '',
  AUTO_MIGRATE: 'false',
});

const envFormBool = reactive({ AUTO_MIGRATE: false });
watch(() => envFormBool.AUTO_MIGRATE, (v) => { envForm.AUTO_MIGRATE = v ? 'true' : 'false'; });

const visibleSecrets = reactive<Record<string, boolean>>({});
const toggleSecret = (key: string) => { visibleSecrets[key] = !visibleSecrets[key]; };

const dbStatus = ref({ connected: false });

const fetchEnvData = async () => {
  envLoading.value = true;
  try {
    const [data, dbInfo]: [any, any] = await Promise.all([
      $fetch('/api/environment/current'),
      $fetch('/api/environment/check-db').catch(() => ({ connected: false })),
    ]);
    dbStatus.value = dbInfo;

    // Маппинг плоский
    const flat: Record<string, string> = {};
    Object.values(data).forEach((group: any) => {
      Object.entries(group).forEach(([k, v]) => {
        flat[k] = (v === '••••••••') ? '' : String(v ?? '');
      });
    });
    Object.assign(envForm, flat);
    envFormBool.AUTO_MIGRATE = flat.AUTO_MIGRATE === 'true';
  } catch {}
  finally { envLoading.value = false; }
};

const saveEnvGroup = async (keys: string[]) => {
  saving.value = true;
  try {
    const payload: Record<string, string> = {};
    keys.forEach(k => {
      // Не затираем секреты если поле пустое (пользователь не менял)
      if (envForm[k]) payload[k] = envForm[k];
    });
    if (!Object.keys(payload).length) {
      showNotification({ type: 'warning', title: 'Нет изменений', message: 'Заполните хотя бы одно поле' });
      return;
    }
    await $fetch('/api/environment/save', { method: 'POST', body: payload });
    showNotification({ type: 'success', title: 'Сохранено', message: 'Настройки записаны в .env' });
  } catch (e: any) {
    showNotification({ type: 'danger', title: 'Ошибка', message: e.data?.message || 'Ошибка сохранения' });
  } finally { saving.value = false; }
};

const testDbConnection = async () => {
  testingDb.value = true;
  connectionTest.value = null;
  try {
    const r: any = await $fetch('/api/environment/test-connection', {
      method: 'POST',
      body: {
        DATABASE_HOST: envForm.DATABASE_HOST,
        DATABASE_PORT: envForm.DATABASE_PORT,
        DATABASE_NAME: envForm.DATABASE_NAME,
        DATABASE_USER: envForm.DATABASE_USER,
        DATABASE_PASSWORD: envForm.DATABASE_PASSWORD,
      }
    });
    connectionTest.value = { success: true, message: r.message || 'Подключение успешно' };
    dbStatus.value.connected = true;
  } catch (e: any) {
    connectionTest.value = { success: false, message: e.data?.message || 'Ошибка подключения' };
    dbStatus.value.connected = false;
  } finally { testingDb.value = false; }
};

const saveAll = async (scope: 'general' | 'user') => {
  saving.value = true;
  // Сохраняем пользовательские настройки
  await updateSettings(userForm.value);
  // Если общие — сохраняем и APP_NAME, APP_URL
  if (scope === 'general') {
    await saveEnvGroup(['APP_NAME', 'APP_URL']);
  }
  saving.value = false;
};

const executeRestart = async () => {
  showRestartConfirm.value = false;
  restarting.value = true;
  try {
    await $fetch('/api/environment/restart', { method: 'POST' });
    showNotification({ type: 'success', title: 'Перезагрузка', message: 'Сервер перезапускается...' });
    setTimeout(() => window.location.reload(), 5000);
  } catch (e: any) {
    showNotification({ type: 'danger', title: 'Ошибка', message: e.data?.message || 'Не удалось перезапустить' });
  } finally { restarting.value = false; }
};

// ============================================================================
// NAVIGATION TABS
// ============================================================================
const activeTab = ref('general');

const allTabs = computed(() => [
  {
    id: 'general', label: 'Общие', description: 'Язык, название, URL',
    icon: Settings, bgClass: 'bg-primary/10',
    permission: null,
  },
  {
    id: 'notifications', label: 'Уведомления', description: 'Email, Push, SMS',
    icon: Bell, bgClass: 'bg-blue-100 dark:bg-blue-900/20',
    permission: null,
  },
  {
    id: 'appearance', label: 'Внешний вид', description: 'Тема и шрифт',
    icon: Palette, bgClass: 'bg-purple-100 dark:bg-purple-900/20',
    permission: null,
  },
  {
    id: 'schedule', label: 'Расписание', description: 'Параметры расписания',
    icon: Calendar, bgClass: 'bg-indigo-100 dark:bg-indigo-900/20',
    permission: null,
  },
  {
    id: 'classrooms', label: 'Аудитории', description: 'Управление аудиториями',
    icon: DoorOpen, bgClass: 'bg-green-100 dark:bg-green-900/20',
    permission: null,
  },
  {
    id: 'ai', label: 'AI Настройки', description: 'API ключи, модели',
    icon: Bot, bgClass: 'bg-orange-100 dark:bg-orange-900/20',
    permission: Permission.SETTINGS_MANAGE,
  },
  {
    id: 'telegram', label: 'Telegram Бот', description: 'Токен, Webhook, статус',
    icon: MessageSquareText, bgClass: 'bg-sky-100 dark:bg-sky-900/20',
    permission: Permission.SETTINGS_MANAGE,
  },
  {
    id: 'database', label: 'База данных', description: 'Хост, порт, имя БД',
    icon: Database, bgClass: 'bg-yellow-100 dark:bg-yellow-900/20',
    permission: Permission.SETTINGS_MANAGE,
  },
  {
    id: 'security', label: 'Безопасность', description: 'JWT секреты',
    icon: ShieldCheck, bgClass: 'bg-red-100 dark:bg-red-900/20',
    permission: Permission.SETTINGS_MANAGE,
  },
  {
    id: 'system', label: 'Система', description: 'NODE_ENV, перезапуск',
    icon: Server, bgClass: 'bg-gray-100 dark:bg-gray-800',
    permission: Permission.SETTINGS_MANAGE,
  },
]);

const tabs = computed(() =>
  allTabs.value.filter(t => !t.permission || (user.value && roleHasPermission(user.value.role, t.permission)))
);

// ============================================================================
// STATIC CONFIG
// ============================================================================
const notificationOptions = [
  { key: 'notifications_email', label: 'Email уведомления', description: 'Получать уведомления на email' },
  { key: 'notifications_push', label: 'Push уведомления', description: 'Получать push-уведомления в браузере' },
  { key: 'notifications_sms', label: 'SMS уведомления', description: 'Получать SMS на мобильный телефон' },
];

const themes = [
  { value: 'light', label: 'Светлая', icon: Sun, bgClass: 'bg-yellow-50 dark:bg-yellow-900/20', iconClass: 'text-yellow-500' },
  { value: 'dark', label: 'Тёмная', icon: Moon, bgClass: 'bg-gray-800', iconClass: 'text-blue-400' },
  { value: 'auto', label: 'Авто', icon: SunMoon, bgClass: 'bg-gray-100 dark:bg-gray-700', iconClass: 'text-gray-600' },
];

const fontSizes = [
  { value: 'small', label: 'Маленький', textClass: 'text-xs' },
  { value: 'medium', label: 'Средний', textClass: 'text-sm' },
  { value: 'large', label: 'Большой', textClass: 'text-base' },
];

const securityFields = [
  { key: 'JWT_SECRET', label: 'JWT Secret', placeholder: 'Оставьте пустым чтобы не менять', isSecret: true },
  { key: 'JWT_EXPIRES_IN', label: 'JWT Срок жизни', placeholder: '7d', isSecret: false },
  { key: 'REFRESH_TOKEN_SECRET', label: 'Refresh Secret', placeholder: 'Оставьте пустым чтобы не менять', isSecret: true },
  { key: 'REFRESH_TOKEN_EXPIRES_IN', label: 'Refresh Срок жизни', placeholder: '30d', isSecret: false },
];

// ============================================================================
// LIFECYCLE
// ============================================================================
onMounted(async () => {
  await fetchSettings();
  await fetchEnvData();
});
</script>
