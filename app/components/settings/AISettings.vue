<template>
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Настройки AI
      </h3>
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Управление API ключами, провайдерами и лимитами использования
        искусственного интеллекта для обработки сертификатов.
      </p>

      <!-- Loading State -->
      <div v-if="loading" class="flex items-center justify-center p-8">
        <div
          class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"
        ></div>
        <span class="ml-3 text-gray-600 dark:text-gray-400"
          >Загрузка настроек...</span
        >
      </div>

      <!-- Main Content -->
      <div v-else class="space-y-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Tokens -->
          <div
            class="rounded-lg border border-gray-200 bg-linear-to-br from-primary/5 to-primary/10 p-4 dark:border-gray-700 dark:from-primary/10 dark:to-primary/20"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20"
              >
                <Cpu class="h-5 w-5 text-primary" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Всего токенов
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(stats?.totalTokensUsed || 0) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Total Cost -->
          <div
            class="rounded-lg border border-gray-200 bg-linear-to-br from-success/5 to-success/10 p-4 dark:border-gray-700 dark:from-success/10 dark:to-success/20"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-success/20"
              >
                <DollarSign class="h-5 w-5 text-success" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Общая стоимость
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  ${{ (stats?.totalCostUsd || 0).toFixed(4) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Today's Usage -->
          <div
            class="rounded-lg border border-gray-200 bg-linear-to-br from-warning/5 to-warning/10 p-4 dark:border-gray-700 dark:from-warning/10 dark:to-warning/20"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/20"
              >
                <Clock class="h-5 w-5 text-warning" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Сегодня</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatNumber(stats?.tokensUsedToday || 0) }}
                </p>
              </div>
            </div>
          </div>

          <!-- Errors 24h -->
          <div
            class="rounded-lg border border-gray-200 bg-linear-to-br from-danger/5 to-danger/10 p-4 dark:border-gray-700 dark:from-danger/10 dark:to-danger/20"
          >
            <div class="flex items-center gap-3">
              <div
                class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/20"
              >
                <AlertTriangle class="h-5 w-5 text-danger" />
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  Ошибок (24ч)
                </p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ stats?.errorCount24h || 0 }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- AI Settings List -->
        <div
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white">
              Конфигурации AI провайдеров
            </h4>
            <button
              @click="showAddModal = true"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus class="h-4 w-4" />
              Добавить
            </button>
          </div>

          <!-- Settings Table -->
          <div v-if="settings.length > 0" class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-600">
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Имя / Провайдер
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    API Ключ
                  </th>
                  <th
                    class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Модели
                  </th>
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Токены
                  </th>
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Статус
                  </th>
                  <th
                    class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
                  >
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="setting in settings"
                  :key="setting.id"
                  class="border-b border-gray-100 dark:border-gray-700"
                  :class="{
                    'bg-primary/5 dark:bg-primary/10': setting.isDefault,
                  }"
                >
                  <td class="px-3 py-3">
                    <div class="flex items-center gap-2">
                      <div
                        class="flex h-8 w-8 items-center justify-center rounded-lg"
                        :class="getProviderColor(setting.provider)"
                      >
                        <component
                          :is="getProviderIcon(setting.provider)"
                          class="h-4 w-4"
                        />
                      </div>
                      <div>
                        <p class="font-medium text-gray-900 dark:text-white">
                          {{ setting.apiKeyName || setting.provider }}
                          <span
                            v-if="setting.isDefault"
                            class="ml-2 inline-flex items-center rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary"
                          >
                            По умолчанию
                          </span>
                        </p>
                        <p
                          class="text-xs text-gray-500 dark:text-gray-400 capitalize"
                        >
                          {{ setting.provider }}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td class="px-3 py-3">
                    <code
                      class="rounded bg-gray-100 px-2 py-1 text-xs dark:bg-gray-700"
                      >{{ setting.apiKeyMasked }}</code
                    >
                  </td>
                  <td class="px-3 py-3">
                    <div class="text-xs">
                      <p>
                        <span class="text-gray-500">Vision:</span>
                        {{ setting.visionModel }}
                      </p>
                      <p>
                        <span class="text-gray-500">Text:</span>
                        {{ setting.textModel }}
                      </p>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <div class="text-xs">
                      <p class="font-medium text-gray-900 dark:text-white">
                        {{ formatNumber(setting.totalTokensUsed) }}
                      </p>
                      <p class="text-gray-500">
                        ${{ setting.totalCostUsd.toFixed(4) }}
                      </p>
                    </div>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <span
                      :class="[
                        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                        setting.isActive
                          ? 'bg-success/20 text-success'
                          : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
                      ]"
                    >
                      {{ setting.isActive ? "Активен" : "Отключен" }}
                    </span>
                    <p
                      v-if="setting.lastErrorAt"
                      class="mt-1 text-xs text-danger"
                    >
                      Последняя ошибка: {{ formatDate(setting.lastErrorAt) }}
                    </p>
                  </td>
                  <td class="px-3 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        @click="testConnection(setting)"
                        :disabled="testingId === setting.id"
                        class="rounded p-1.5 text-primary hover:bg-primary/10 transition"
                        title="Тестировать подключение"
                      >
                        <Loader2
                          v-if="testingId === setting.id"
                          class="h-4 w-4 animate-spin"
                        />
                        <Zap v-else class="h-4 w-4" />
                      </button>
                      <button
                        @click="editSetting(setting)"
                        class="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                        title="Редактировать"
                      >
                        <Edit3 class="h-4 w-4" />
                      </button>
                      <button
                        v-if="!setting.isDefault"
                        @click="setDefault(setting)"
                        class="rounded p-1.5 text-warning hover:bg-warning/10 transition"
                        title="Сделать по умолчанию"
                      >
                        <Star class="h-4 w-4" />
                      </button>
                      <button
                        v-if="settings.length > 1"
                        @click="deleteSetting(setting)"
                        class="rounded p-1.5 text-danger hover:bg-danger/10 transition"
                        title="Удалить"
                      >
                        <Trash2 class="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          <div
            v-else
            class="flex flex-col items-center justify-center py-12 text-center"
          >
            <div
              class="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-4"
            >
              <Settings class="h-8 w-8 text-gray-400" />
            </div>
            <h4 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Нет настроек AI
            </h4>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Добавьте API ключ для начала работы с AI функциями
            </p>
            <button
              @click="showAddModal = true"
              class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
            >
              <Plus class="h-4 w-4" />
              Добавить настройку
            </button>
          </div>
        </div>

        <!-- Recent Errors -->
        <div
          v-if="stats?.recentErrors && stats.recentErrors.length > 0"
          class="rounded-lg border border-danger/30 bg-danger/5 p-4 flex items-center justify-between dark:border-danger/30"
        >
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/20">
              <AlertTriangle class="h-5 w-5 text-danger" />
            </div>
            <div>
              <h4 class="font-medium text-gray-900 dark:text-white">Лог ошибок API</h4>
              <p class="text-sm text-danger">Зафиксировано {{ stats.recentErrors.length }} недавних ошибок</p>
            </div>
          </div>
          <button
            @click="showErrorsModal = true"
            class="inline-flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-white transition hover:bg-danger/90"
          >
            Открыть журнал
          </button>
        </div>

        <!-- Usage by Model Chart -->
        <div
          v-if="stats?.usageByModel && stats.usageByModel.length > 0"
          class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
        >
          <h4 class="font-medium text-gray-900 dark:text-white mb-4">
            Использование по моделям (30 дней)
          </h4>
          <div class="space-y-3">
            <div
              v-for="model in stats.usageByModel"
              :key="model.model"
              class="relative"
            >
              <div class="flex items-center justify-between mb-1">
                <span
                  class="text-sm font-medium text-gray-700 dark:text-gray-300"
                  >{{ model.model }}</span
                >
                <span class="text-xs text-gray-500"
                  >{{ formatNumber(model.totalTokens) }} токенов · ${{
                    model.totalCost.toFixed(4)
                  }}</span
                >
              </div>
              <div class="h-2 w-full rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  class="h-2 rounded-full bg-primary transition-all"
                  :style="{
                    width: `${(model.totalTokens / maxTokensUsage) * 100}%`,
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <Teleport to="body">
      <div
        v-if="showAddModal || !!editingSettings"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          @click.stop
          class="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl dark:bg-boxdark mx-auto max-h-[90vh] overflow-y-auto"
        >
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              {{
                editingSettings
                  ? "Редактировать настройку AI"
                  : "Добавить настройку AI"
              }}
            </h3>
            <button
              @click="closeModal"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="mb-4 rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/50 dark:text-red-300 border border-red-200 dark:border-red-800"
          >
            <div class="flex items-center gap-2">
              <AlertTriangle class="h-4 w-4 shrink-0" />
              <span>{{ errorMessage }}</span>
            </div>
          </div>

          <form @submit.prevent="saveSettings" class="space-y-4">
            <!-- Provider -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Провайдер *
                </label>
                <span class="text-xs text-primary font-medium">10 топовых + Custom</span>
              </div>
              <select
                v-model="form.provider"
                @change="onProviderChange"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option v-for="p in availableProviders" :key="p.id" :value="p.id">
                  {{ p.name }} — {{ p.description }}
                </option>
              </select>
            </div>

            <!-- API Key Name -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Название (опционально)
              </label>
              <input
                v-model="form.apiKeyName"
                type="text"
                placeholder="Например: Production Key"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <!-- API Key with Load Models button -->
            <div>
              <div class="flex items-center justify-between mb-2">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  API Ключ
                  {{
                    editingSettings ? "(оставьте пустым, чтобы не менять)" : "*"
                  }}
                </label>
                <button
                  type="button"
                  @click="loadModelsForCurrentKey"
                  :disabled="loadingModels || (!form.apiKey && !editingSettings)"
                  class="text-xs font-semibold text-primary hover:text-primary/80 flex items-center gap-1.5 transition-colors disabled:opacity-40 cursor-pointer"
                  title="Загрузить список доступных моделей для этого ключа"
                >
                  <Loader2 v-if="loadingModels" class="w-3.5 h-3.5 animate-spin" />
                  <RefreshCw v-else class="w-3.5 h-3.5" />
                  <span>{{ loadingModels ? 'Загрузка...' : 'Загрузить модели' }}</span>
                </button>
              </div>
              <input
                v-model="form.apiKey"
                @blur="onApiKeyBlur"
                type="text"
                :placeholder="editingSettings ? '(Ключ сохранен — нажмите «Загрузить модели»)' : 'sk-...'"
                :required="!editingSettings"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white font-mono text-sm"
              />
              <p v-if="modelsLoadedStatus" class="mt-1 text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check class="w-3.5 h-3.5" /> {{ modelsLoadedStatus }}
              </p>
            </div>

            <!-- Base URL (for custom provider or editable override) -->
            <div v-if="form.provider === 'custom' || showCustomBaseUrl">
              <div class="flex items-center justify-between mb-1.5">
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Base URL {{ form.provider === 'custom' ? '*' : '(переопределение)' }}
                </label>
                <button
                  v-if="form.provider !== 'custom'"
                  type="button"
                  @click="showCustomBaseUrl = false; resetBaseUrlToDefault()"
                  class="text-xs text-gray-400 hover:text-gray-600"
                >
                  Сбросить на дефолтный
                </button>
              </div>
              <input
                v-model="form.baseUrl"
                type="url"
                :placeholder="currentProviderDef?.defaultBaseUrl || 'https://api.example.com/v1'"
                :required="form.provider === 'custom'"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white font-mono text-xs"
              />
            </div>
            <div v-else-if="form.provider !== 'custom'" class="flex items-center justify-between text-xs text-gray-500 py-1">
              <span class="truncate max-w-[80%] font-mono text-[11px] opacity-75">
                URL: {{ currentProviderDef?.defaultBaseUrl || 'Стандартный URL провайдера' }}
              </span>
              <button
                type="button"
                @click="showCustomBaseUrl = true"
                class="text-primary hover:underline font-medium shrink-0 ml-2 cursor-pointer"
              >
                Изменить URL
              </button>
            </div>

            <!-- Models: Vision & Text with flexible dropdown / manual input -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <!-- Vision Model -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                  >
                    <Eye class="w-3.5 h-3.5 text-primary" />
                    <span>Vision Model</span>
                  </label>
                  <button
                    type="button"
                    @click="isCustomVision = !isCustomVision"
                    class="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    {{ isCustomVision ? 'Из списка' : 'Вручную' }}
                  </button>
                </div>

                <!-- Custom Input -->
                <input
                  v-if="isCustomVision"
                  v-model="form.visionModel"
                  type="text"
                  placeholder="openai/gpt-4o"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white font-mono text-xs"
                />

                <!-- Select Dropdown -->
                <select
                  v-else
                  v-model="form.visionModel"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-xs font-mono"
                >
                  <option v-for="m in currentVisionModels" :key="m" :value="m">
                    {{ m }}
                  </option>
                </select>
                <p class="mt-1 text-[10px] text-gray-400">Модель для фото, сканов и PDF</p>
              </div>

              <!-- Text Model -->
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label
                    class="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
                  >
                    <FileText class="w-3.5 h-3.5 text-emerald-600" />
                    <span>Text Model</span>
                  </label>
                  <button
                    type="button"
                    @click="isCustomText = !isCustomText"
                    class="text-[11px] font-medium text-primary hover:underline cursor-pointer"
                  >
                    {{ isCustomText ? 'Из списка' : 'Вручную' }}
                  </button>
                </div>

                <!-- Custom Input -->
                <input
                  v-if="isCustomText"
                  v-model="form.textModel"
                  type="text"
                  placeholder="openai/gpt-4o-mini"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white font-mono text-xs"
                />

                <!-- Select Dropdown -->
                <select
                  v-else
                  v-model="form.textModel"
                  class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white text-xs font-mono"
                >
                  <option v-for="m in currentTextModels" :key="m" :value="m">
                    {{ m }}
                  </option>
                </select>
                <p class="mt-1 text-[10px] text-gray-400">Модель для разбора текста и списков</p>
              </div>
            </div>

            <!-- Parameters -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Max Tokens
                </label>
                <input
                  v-model.number="form.maxTokens"
                  type="number"
                  min="100"
                  max="16000"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Temperature
                </label>
                <input
                  v-model.number="form.temperature"
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Budgets -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Дневной лимит ($)
                </label>
                <input
                  v-model.number="form.dailyBudgetUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Без лимита"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Месячный лимит ($)
                </label>
                <input
                  v-model.number="form.monthlyBudgetUsd"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Без лимита"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
            </div>

            <!-- Switches -->
            <div class="flex items-center gap-6">
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="form.isActive"
                  class="peer sr-only"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"
                ></div>
                <span
                  class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >Активен</span
                >
              </label>

              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  v-model="form.isDefault"
                  class="peer sr-only"
                />
                <div
                  class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-warning peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-warning/20 dark:border-gray-600 dark:bg-gray-700"
                ></div>
                <span
                  class="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300"
                  >По умолчанию</span
                >
              </label>
            </div>

            <!-- Actions -->
            <div
              class="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700"
            >
              <button
                type="button"
                @click="closeModal"
                class="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                Отмена
              </button>
              <button
                type="submit"
                :disabled="saving"
                class="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                <Loader2 v-if="saving" class="h-4 w-4 animate-spin" />
                {{ editingSettings ? "Сохранить" : "Создать" }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Errors Log Modal -->
    <Teleport to="body">
      <div
        v-if="showErrorsModal"
        class="fixed inset-0 z-9999 flex items-center justify-center bg-black/50 p-4"
      >
        <div
          @click.stop
          class="w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl dark:bg-boxdark mx-auto max-h-[90vh] flex flex-col"
        >
          <div class="flex items-center justify-between mb-6 shrink-0 border-b border-gray-200 dark:border-gray-700 pb-4">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <AlertTriangle class="h-6 w-6 text-danger" />
              Журнал ошибок API
            </h3>
            <button
              @click="closeModal"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <div class="overflow-y-auto pr-2 space-y-3">
            <div
              v-for="error in stats?.recentErrors"
              :key="error.id"
              class="rounded-lg border border-danger/20 bg-danger/5 p-4 dark:bg-danger/10"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    {{ getErrorTypeLabel(error.errorType) }}
                    <span class="rounded bg-white border border-gray-200 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400 font-mono">{{ error.errorCode }}</span>
                  </p>
                  <p class="mt-2 text-sm text-gray-600 dark:text-gray-400 wrap-break-word whitespace-pre-wrap">
                    {{ error.errorMessage }}
                  </p>
                </div>
                <span class="text-xs font-medium text-gray-500 whitespace-nowrap ml-4 mt-0.5">
                  {{ formatDate(error.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import {
  Cpu,
  DollarSign,
  Clock,
  AlertTriangle,
  Plus,
  Edit3,
  Trash2,
  Star,
  Zap,
  Settings,
  X,
  Loader2,
  Bot,
  Cloud,
  Server,
  Eye,
  RefreshCw,
  FileText,
  Sparkles,
  Layers,
  Flame,
  Globe,
  Radio,
  Brain,
  Check,
} from "lucide-vue-next";

// Types
interface AISetting {
  id: string;
  provider: string;
  apiKeyMasked: string;
  apiKeyName: string | null;
  baseUrl: string | null;
  visionModel: string;
  textModel: string;
  maxTokens: number;
  temperature: number;
  monthlyBudgetUsd: number | null;
  dailyBudgetUsd: number | null;
  isActive: boolean;
  isDefault: boolean;
  lastErrorAt: Date | null;
  lastErrorMessage: string | null;
  totalTokensUsed: number;
  totalCostUsd: number;
}

interface AIStats {
  totalSettings: number;
  activeSettings: number;
  totalTokensUsed: number;
  totalCostUsd: number;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  errorCount24h: number;
  errorsByType: Record<string, number>;
  usageByModel: Array<{
    model: string;
    totalTokens: number;
    totalCost: number;
    requestCount: number;
  }>;
  recentErrors: Array<{
    id: string;
    errorType: string;
    errorCode: string;
    errorMessage: string;
    createdAt: Date;
  }>;
}

interface ProviderDef {
  id: string;
  name: string;
  description: string;
  defaultBaseUrl?: string;
  supportsModelsList: boolean;
  presetVisionModels: string[];
  presetTextModels: string[];
}

const DEFAULT_PROVIDERS: ProviderDef[] = [
  {
    id: "openai",
    name: "OpenAI",
    description: "GPT-4o, GPT-4o-mini, o1",
    defaultBaseUrl: "https://api.openai.com/v1",
    supportsModelsList: true,
    presetVisionModels: ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo"],
    presetTextModels: ["gpt-4o-mini", "gpt-4o", "gpt-3.5-turbo", "o1-mini"],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    description: "Мульти-провайдер агрегатор (100+ моделей)",
    defaultBaseUrl: "https://openrouter.ai/api/v1",
    supportsModelsList: true,
    presetVisionModels: ["openai/gpt-4o", "openai/gpt-4o-mini", "google/gemini-flash-1.5", "anthropic/claude-3.5-sonnet"],
    presetTextModels: ["openai/gpt-4o-mini", "deepseek/deepseek-chat", "meta-llama/llama-3.3-70b-instruct", "google/gemini-flash-1.5"],
  },
  {
    id: "gemini",
    name: "Google Gemini",
    description: "Gemini 1.5 Pro, Flash, Flash-8B",
    defaultBaseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    supportsModelsList: true,
    presetVisionModels: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"],
    presetTextModels: ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.5-flash-8b"],
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    description: "DeepSeek-V3, DeepSeek-R1",
    defaultBaseUrl: "https://api.deepseek.com/v1",
    supportsModelsList: true,
    presetVisionModels: ["deepseek-chat"],
    presetTextModels: ["deepseek-chat", "deepseek-reasoner"],
  },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    description: "Claude 3.5 Sonnet, Claude 3 Opus",
    defaultBaseUrl: "https://api.anthropic.com/v1",
    supportsModelsList: false,
    presetVisionModels: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307", "claude-3-opus-20240229"],
    presetTextModels: ["claude-3-5-sonnet-20241022", "claude-3-5-haiku-20241022", "claude-3-haiku-20240307"],
  },
  {
    id: "groq",
    name: "Groq",
    description: "Llama 3.3, Mixtral (сверхбыстрый LPU чип)",
    defaultBaseUrl: "https://api.groq.com/openai/v1",
    supportsModelsList: true,
    presetVisionModels: ["llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"],
    presetTextModels: ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"],
  },
  {
    id: "mistral",
    name: "Mistral AI",
    description: "Mistral Large, Pixtral, Codestral",
    defaultBaseUrl: "https://api.mistral.ai/v1",
    supportsModelsList: true,
    presetVisionModels: ["pixtral-12b-2409", "pixtral-large-latest"],
    presetTextModels: ["mistral-small-latest", "mistral-large-latest", "open-mistral-nemo"],
  },
  {
    id: "together",
    name: "Together AI",
    description: "Llama 3, Qwen, DeepSeek хостинг",
    defaultBaseUrl: "https://api.together.xyz/v1",
    supportsModelsList: true,
    presetVisionModels: ["meta-llama/Llama-Vision-Free", "meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo"],
    presetTextModels: ["meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo", "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "deepseek-ai/DeepSeek-V3"],
  },
  {
    id: "cohere",
    name: "Cohere",
    description: "Command R+, Command R",
    defaultBaseUrl: "https://api.cohere.ai/v1",
    supportsModelsList: true,
    presetVisionModels: ["command-r-plus-08-2024", "command-r-08-2024"],
    presetTextModels: ["command-r-plus-08-2024", "command-r-08-2024", "command-light"],
  },
  {
    id: "nim",
    name: "NVIDIA NIM",
    description: "Enterprise ускоренные microservices",
    defaultBaseUrl: "https://integrate.api.nvidia.com/v1",
    supportsModelsList: true,
    presetVisionModels: ["meta/llama-3.2-11b-vision-instruct", "meta/llama-3.2-90b-vision-instruct"],
    presetTextModels: ["meta/llama-3.3-70b-instruct", "deepseek-ai/deepseek-r1", "mistralai/mixtral-8x22b-instruct-v0.1"],
  },
  {
    id: "custom",
    name: "Custom (OpenAI-совместимый)",
    description: "Собственный сервер / vLLM / Ollama / LocalAI",
    defaultBaseUrl: "",
    supportsModelsList: true,
    presetVisionModels: ["llava", "qwen-vl", "gpt-4o"],
    presetTextModels: ["llama3", "mistral", "qwen2.5", "gpt-3.5-turbo"],
  },
];

// State
const loading = ref(true);
const saving = ref(false);
const testingId = ref<string | null>(null);
const settings = ref<AISetting[]>([]);
const stats = ref<AIStats | null>(null);
const showAddModal = ref(false);
const showErrorsModal = ref(false);
const editingSettings = ref<AISetting | null>(null);
const errorMessage = ref<string | null>(null);

const availableProviders = ref<ProviderDef[]>(DEFAULT_PROVIDERS);
const loadingModels = ref(false);
const modelsLoadedStatus = ref<string | null>(null);
const showCustomBaseUrl = ref(false);
const isCustomVision = ref(false);
const isCustomText = ref(false);

const availableVisionModels = ref<string[]>([]);
const availableTextModels = ref<string[]>([]);

// Form
const form = ref({
  provider: "openrouter" as string,
  apiKeyName: "",
  apiKey: "",
  baseUrl: "https://openrouter.ai/api/v1",
  visionModel: "openai/gpt-4o",
  textModel: "openai/gpt-4o-mini",
  maxTokens: 1500,
  temperature: 0.1,
  dailyBudgetUsd: null as number | null,
  monthlyBudgetUsd: null as number | null,
  isActive: true,
  isDefault: false,
});

// Computed
const isModalOpen = computed(
  () => showAddModal.value || !!editingSettings.value || showErrorsModal.value,
);

const currentProviderDef = computed(() => {
  return (
    availableProviders.value.find((p) => p.id === form.value.provider) ||
    availableProviders.value[0]
  );
});

const currentVisionModels = computed(() => {
  const set = new Set<string>();
  if (form.value.visionModel) set.add(form.value.visionModel);
  availableVisionModels.value.forEach((m) => set.add(m));
  if (currentProviderDef.value) {
    currentProviderDef.value.presetVisionModels.forEach((m) => set.add(m));
  }
  return Array.from(set);
});

const currentTextModels = computed(() => {
  const set = new Set<string>();
  if (form.value.textModel) set.add(form.value.textModel);
  availableTextModels.value.forEach((m) => set.add(m));
  if (currentProviderDef.value) {
    currentProviderDef.value.presetTextModels.forEach((m) => set.add(m));
  }
  return Array.from(set);
});

const maxTokensUsage = computed(() => {
  if (!stats.value?.usageByModel?.length) return 1;
  return Math.max(...stats.value.usageByModel.map((m) => m.totalTokens));
});

// Notification helper
const { show: showNotification } = useNotification();

// Methods
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getProviderIcon = (provider: string) => {
  switch (provider) {
    case "openai":
      return Bot;
    case "openrouter":
      return Cloud;
    case "gemini":
      return Sparkles;
    case "deepseek":
      return Brain;
    case "anthropic":
      return Cpu;
    case "groq":
      return Zap;
    case "mistral":
      return Flame;
    case "together":
      return Layers;
    case "cohere":
      return Radio;
    case "nim":
      return Globe;
    default:
      return Server;
  }
};

const getProviderColor = (provider: string): string => {
  switch (provider) {
    case "openai":
      return "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400";
    case "openrouter":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    case "gemini":
      return "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400";
    case "deepseek":
      return "bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400";
    case "anthropic":
      return "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400";
    case "groq":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
    case "mistral":
      return "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400";
    case "together":
      return "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400";
    case "cohere":
      return "bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400";
    case "nim":
      return "bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400";
    default:
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
  }
};

const getErrorTypeLabel = (type: string): string => {
  const labels: Record<string, string> = {
    rate_limit: "Превышен лимит запросов",
    insufficient_credits: "Недостаточно кредитов",
    invalid_key: "Неверный API ключ",
    model_error: "Ошибка модели",
    network: "Сетевая ошибка",
    other: "Другая ошибка",
  };
  return labels[type] || type;
};

const resetBaseUrlToDefault = () => {
  form.value.baseUrl = currentProviderDef.value?.defaultBaseUrl || "";
};

const onProviderChange = () => {
  const p = currentProviderDef.value;
  if (!p) return;

  if (p.id === "custom") {
    showCustomBaseUrl.value = true;
    if (!form.value.baseUrl) form.value.baseUrl = "http://localhost:11434/v1";
  } else {
    showCustomBaseUrl.value = false;
    form.value.baseUrl = p.defaultBaseUrl || "";
  }

  // Reset dynamic models list to presets
  availableVisionModels.value = [...p.presetVisionModels];
  availableTextModels.value = [...p.presetTextModels];
  modelsLoadedStatus.value = null;

  const defaultVision = p.presetVisionModels[0];
  if (defaultVision) {
    form.value.visionModel = defaultVision;
  }
  const defaultText = p.presetTextModels[0];
  if (defaultText) {
    form.value.textModel = defaultText;
  }
};

const loadModelsForCurrentKey = async () => {
  if (loadingModels.value) return;
  if (!form.value.apiKey && !editingSettings.value) {
    showNotification({
      type: "warning",
      message: "Введите API ключ для загрузки списка моделей",
    });
    return;
  }

  loadingModels.value = true;
  modelsLoadedStatus.value = null;

  try {
    const res = await ($fetch as any)("/api/admin/ai-settings/models", {
      method: "POST",
      body: {
        provider: form.value.provider,
        apiKey: form.value.apiKey || undefined,
        settingId: editingSettings.value?.id,
        baseUrl: form.value.baseUrl || undefined,
      },
    });

    const data = (res as any).data || res;
    if (data && (data.visionModels?.length > 0 || data.textModels?.length > 0)) {
      availableVisionModels.value = data.visionModels || [];
      availableTextModels.value = data.textModels || [];
      modelsLoadedStatus.value = `Загружено моделей: ${data.total || (availableVisionModels.value.length + availableTextModels.value.length)} (Vision: ${availableVisionModels.value.length}, Text: ${availableTextModels.value.length})`;
      
      if (data.isPreset) {
        showNotification({
          type: "warning",
          message: data.error ? `${data.error}. Использованы стандартные пресеты.` : "Использованы стандартные пресеты",
        });
      } else {
        showNotification({
          type: "success",
          message: `Модели успешно загружены (${data.total || (data.visionModels.length + data.textModels.length)} шт.)`,
        });
      }

      if (data.visionModels.length > 0 && !data.visionModels.includes(form.value.visionModel)) {
        form.value.visionModel = data.visionModels[0];
      }
      if (data.textModels.length > 0 && !data.textModels.includes(form.value.textModel)) {
        form.value.textModel = data.textModels[0];
      }
    } else {
      showNotification({
        type: "info",
        message: "Модели не получены из API, используются стандартные пресеты",
      });
    }
  } catch (error: any) {
    console.error("Failed to fetch models:", error);
    showNotification({
      type: "error",
      message:
        error.data?.message ||
        "Не удалось загрузить модели с провайдера. Используйте ручной ввод или пресеты.",
    });
  } finally {
    loadingModels.value = false;
  }
};

const onApiKeyBlur = () => {
  if (
    form.value.apiKey &&
    form.value.apiKey.length > 8 &&
    availableVisionModels.value.length <= (currentProviderDef.value?.presetVisionModels.length || 0)
  ) {
    loadModelsForCurrentKey();
  }
};

const loadProviders = async () => {
  try {
    const res = await ($fetch as any)("/api/admin/ai-settings/providers");
    const list = res?.data?.providers || res?.providers;
    if (list?.length) {
      availableProviders.value = list;
    }
  } catch (err) {
    console.warn("Could not fetch remote providers list, using defaults:", err);
  }
};

const loadSettings = async () => {
  loading.value = true;
  try {
    const [settingsRes, statsRes] = await Promise.all([
      ($fetch as any)("/api/admin/ai-settings"),
      ($fetch as any)("/api/admin/ai-settings/stats"),
    ]);

    settings.value = (settingsRes as any).data || [];
    stats.value = (statsRes as any).data || null;
  } catch (error: any) {
    console.error("Failed to load AI settings:", error);
    showNotification({
      type: "error",
      message: error.data?.message || "Ошибка загрузки настроек AI",
    });
  } finally {
    loading.value = false;
  }
};

const testConnection = async (setting: AISetting) => {
  testingId.value = setting.id;
  try {
    const res = await ($fetch as any)("/api/admin/ai-settings/test", {
      method: "POST",
      body: { settingId: setting.id },
    });

    const data = (res as any).data;
    if (data.connected) {
      showNotification({
        type: "success",
        message: `Подключение успешно! Ответ за ${data.responseTime}мс`,
      });
    } else {
      showNotification({
        type: "error",
        message: data.errorMessage || "Ошибка подключения",
      });
    }
  } catch (error: any) {
    showNotification({
      type: "error",
      message: error.data?.message || "Ошибка тестирования",
    });
  } finally {
    testingId.value = null;
  }
};

const editSetting = (setting: AISetting) => {
  editingSettings.value = setting;
  errorMessage.value = null;
  modelsLoadedStatus.value = null;

  form.value = {
    provider: setting.provider,
    apiKeyName: setting.apiKeyName || "",
    apiKey: "", // Don't show existing key
    baseUrl: setting.baseUrl || "",
    visionModel: setting.visionModel,
    textModel: setting.textModel,
    maxTokens: setting.maxTokens,
    temperature: setting.temperature,
    dailyBudgetUsd: setting.dailyBudgetUsd,
    monthlyBudgetUsd: setting.monthlyBudgetUsd,
    isActive: setting.isActive,
    isDefault: setting.isDefault,
  };

  const pDef = availableProviders.value.find((p) => p.id === setting.provider);
  showCustomBaseUrl.value =
    setting.provider === "custom" ||
    (!!setting.baseUrl && setting.baseUrl !== pDef?.defaultBaseUrl);

  isCustomVision.value = pDef
    ? !pDef.presetVisionModels.includes(setting.visionModel)
    : false;
  isCustomText.value = pDef
    ? !pDef.presetTextModels.includes(setting.textModel)
    : false;

  if (pDef) {
    availableVisionModels.value = [...pDef.presetVisionModels];
    availableTextModels.value = [...pDef.presetTextModels];
  }
};

const setDefault = async (setting: AISetting) => {
  try {
    await ($fetch as any)(`/api/admin/ai-settings/${setting.id}`, {
      method: "PUT",
      body: { isDefault: true },
    });
    showNotification({
      type: "success",
      message: "Настройка установлена по умолчанию",
    });
    await loadSettings();
  } catch (error: any) {
    showNotification({
      type: "error",
      message: error.data?.message || "Ошибка обновления",
    });
  }
};

const deleteSetting = async (setting: AISetting) => {
  if (!confirm("Вы уверены, что хотите удалить эту настройку?")) return;

  try {
    await ($fetch as any)(`/api/admin/ai-settings/${setting.id}`, {
      method: "DELETE",
    });
    showNotification({
      type: "success",
      message: "Настройка удалена",
    });
    await loadSettings();
  } catch (error: any) {
    showNotification({
      type: "error",
      message: error.data?.message || "Ошибка удаления",
    });
  }
};

const closeModal = () => {
  showAddModal.value = false;
  showErrorsModal.value = false;
  editingSettings.value = null;
  errorMessage.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    provider: "openrouter",
    apiKeyName: "",
    apiKey: "",
    baseUrl: "https://openrouter.ai/api/v1",
    visionModel: "openai/gpt-4o",
    textModel: "openai/gpt-4o-mini",
    maxTokens: 1500,
    temperature: 0.1,
    dailyBudgetUsd: null,
    monthlyBudgetUsd: null,
    isActive: true,
    isDefault: false,
  };
  showCustomBaseUrl.value = false;
  isCustomVision.value = false;
  isCustomText.value = false;
  modelsLoadedStatus.value = null;
  availableVisionModels.value = [];
  availableTextModels.value = [];
};

const saveSettings = async () => {
  saving.value = true;
  errorMessage.value = null;

  try {
    const resolvedBaseUrl =
      form.value.baseUrl ||
      currentProviderDef.value?.defaultBaseUrl ||
      undefined;

    const payload: any = {
      provider: form.value.provider,
      apiKeyName: form.value.apiKeyName || undefined,
      baseUrl: resolvedBaseUrl,
      visionModel: form.value.visionModel,
      textModel: form.value.textModel,
      maxTokens: form.value.maxTokens,
      temperature: form.value.temperature,
      dailyBudgetUsd: form.value.dailyBudgetUsd || undefined,
      monthlyBudgetUsd: form.value.monthlyBudgetUsd || undefined,
      isActive: form.value.isActive,
      isDefault: form.value.isDefault,
    };

    if (form.value.apiKey) {
      payload.apiKey = form.value.apiKey;
    }

    if (editingSettings.value) {
      await ($fetch as any)(`/api/admin/ai-settings/${editingSettings.value.id}`, {
        method: "PUT",
        body: payload,
      });
      showNotification({
        type: "success",
        message: "Настройки обновлены",
      });
    } else {
      if (!form.value.apiKey) {
        errorMessage.value = "API ключ обязателен для новой настройки";
        saving.value = false;
        return;
      }
      await ($fetch as any)("/api/admin/ai-settings", {
        method: "POST",
        body: { ...payload, apiKey: form.value.apiKey },
      });
      showNotification({
        type: "success",
        message: "Настройки созданы",
      });
    }

    closeModal();
    loading.value = true;
    await loadSettings();
  } catch (error: any) {
    console.error("Save settings error:", error);
    errorMessage.value =
      error.data?.message || error.message || "Ошибка сохранения настроек";

    showNotification({
      type: "error",
      message: errorMessage.value || "Ошибка",
    });
  } finally {
    saving.value = false;
  }
};

// Lifecycle
onMounted(async () => {
  await Promise.all([loadProviders(), loadSettings()]);
});

onUnmounted(() => {
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});

watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
  } else {
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleEscape);
  }
});

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeModal();
  }
};
</script>

