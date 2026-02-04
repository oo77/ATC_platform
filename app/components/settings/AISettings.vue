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
          class="rounded-lg border border-danger/30 bg-danger/5 p-4 dark:border-danger/30"
        >
          <h4 class="flex items-center gap-2 font-medium text-danger mb-3">
            <AlertTriangle class="h-5 w-5" />
            Недавние ошибки API
          </h4>
          <div class="space-y-2">
            <div
              v-for="error in stats.recentErrors.slice(0, 5)"
              :key="error.id"
              class="rounded-lg bg-white p-3 dark:bg-gray-800 border border-danger/20"
            >
              <div class="flex items-start justify-between">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">
                    {{ getErrorTypeLabel(error.errorType) }}
                    <span class="text-xs text-gray-500 ml-2">{{
                      error.errorCode
                    }}</span>
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {{ error.errorMessage }}
                  </p>
                </div>
                <span class="text-xs text-gray-500">{{
                  formatDate(error.createdAt)
                }}</span>
              </div>
            </div>
          </div>
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
        v-if="isModalOpen"
        @click="closeModal"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
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
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Провайдер *
              </label>
              <select
                v-model="form.provider"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="custom">Custom</option>
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

            <!-- API Key -->
            <div>
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                API Ключ
                {{
                  editingSettings ? "(оставьте пустым, чтобы не менять)" : "*"
                }}
              </label>
              <input
                v-model="form.apiKey"
                type="text"
                :placeholder="editingSettings ? '(Ключ сохранен)' : 'sk-...'"
                :required="!editingSettings"
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <!-- Base URL (for custom provider) -->
            <div v-if="form.provider === 'custom'">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Base URL *
              </label>
              <input
                v-model="form.baseUrl"
                type="url"
                placeholder="https://api.example.com/v1"
                required
                class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
            </div>

            <!-- Models -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Vision Model
                </label>
                <input
                  v-model="form.visionModel"
                  type="text"
                  placeholder="openai/gpt-4o"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Text Model
                </label>
                <input
                  v-model="form.textModel"
                  type="text"
                  placeholder="openai/gpt-3.5-turbo"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
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

// State
const loading = ref(true);
const saving = ref(false);
const testingId = ref<string | null>(null);
const settings = ref<AISetting[]>([]);
const stats = ref<AIStats | null>(null);
const showAddModal = ref(false);
const editingSettings = ref<AISetting | null>(null);
const errorMessage = ref<string | null>(null);

// Form
const form = ref({
  provider: "openrouter" as string,
  apiKeyName: "",
  apiKey: "",
  baseUrl: "",
  visionModel: "openai/gpt-4o",
  textModel: "openai/gpt-3.5-turbo",
  maxTokens: 1500,
  temperature: 0.1,
  dailyBudgetUsd: null as number | null,
  monthlyBudgetUsd: null as number | null,
  isActive: true,
  isDefault: false,
});

// Computed
const isModalOpen = computed(
  () => showAddModal.value || !!editingSettings.value,
);

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
    case "anthropic":
      return Cpu;
    default:
      return Server;
  }
};

const getProviderColor = (provider: string): string => {
  switch (provider) {
    case "openai":
      return "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400";
    case "openrouter":
      return "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400";
    case "anthropic":
      return "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400";
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

const loadSettings = async () => {
  loading.value = true;
  try {
    const [settingsRes, statsRes] = await Promise.all([
      $fetch("/api/admin/ai-settings"),
      $fetch("/api/admin/ai-settings/stats"),
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
    const res = await $fetch("/api/admin/ai-settings/test", {
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
};

const setDefault = async (setting: AISetting) => {
  try {
    await $fetch(`/api/admin/ai-settings/${setting.id}`, {
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
    await $fetch(`/api/admin/ai-settings/${setting.id}`, {
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
  editingSettings.value = null;
  errorMessage.value = null;
  resetForm();
};

const resetForm = () => {
  form.value = {
    provider: "openrouter",
    apiKeyName: "",
    apiKey: "",
    baseUrl: "",
    visionModel: "openai/gpt-4o",
    textModel: "openai/gpt-3.5-turbo",
    maxTokens: 1500,
    temperature: 0.1,
    dailyBudgetUsd: null,
    monthlyBudgetUsd: null,
    isActive: true,
    isDefault: false,
  };
};

const saveSettings = async () => {
  saving.value = true;
  errorMessage.value = null; // Сброс предыдущих ошибок

  try {
    const payload: any = {
      provider: form.value.provider,
      apiKeyName: form.value.apiKeyName || undefined,
      baseUrl: form.value.baseUrl || undefined,
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
      await $fetch(`/api/admin/ai-settings/${editingSettings.value.id}`, {
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
      await $fetch("/api/admin/ai-settings", {
        method: "POST",
        body: { ...payload, apiKey: form.value.apiKey },
      });
      showNotification({
        type: "success",
        message: "Настройки созданы",
      });
    }

    // Сначала закрываем модалку, потом загружаем данные
    closeModal();
    loading.value = true; // Показываем индикатор загрузки списка
    await loadSettings();
  } catch (error: any) {
    console.error("Save settings error:", error);
    // Показываем ошибку В МОДАЛКЕ, чтобы пользователь видел её
    errorMessage.value =
      error.data?.message || error.message || "Ошибка сохранения настроек";

    // Дублируем в уведомлении
    showNotification({
      type: "error",
      message: errorMessage.value || "Ошибка",
    });
  } finally {
    saving.value = false;
  }
};

// Lifecycle
onMounted(() => {
  loadSettings();
});

onUnmounted(() => {
  // Очистка при размонтировании компонента
  document.body.style.overflow = "";
  document.removeEventListener("keydown", handleEscape);
});

// Блокировка скролла и обработка Escape при открытии модалки
watch(isModalOpen, (isOpen) => {
  if (isOpen) {
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);
  } else {
    document.body.style.overflow = "";
    document.removeEventListener("keydown", handleEscape);
  }
});

// Обработчик клавиши Escape
const handleEscape = (e: KeyboardEvent) => {
  if (e.key === "Escape") {
    closeModal();
  }
};
</script>
