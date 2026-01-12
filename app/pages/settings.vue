<template>
  <div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">
    <!-- Заголовок страницы -->
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Настройки
      </h2>
    </div>

    <!-- Индикатор загрузки -->
    <div v-if="loading && !form" class="flex justify-center p-8">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
    </div>

    <!-- Вкладки настроек -->
    <div v-else class="flex flex-col gap-6">
      <!-- Tabs Navigation -->
      <div class="rounded-lg bg-gray-50 p-1 dark:bg-gray-800">
        <nav class="flex gap-1" aria-label="Tabs">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'flex-1 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200',
              activeTab === tab.id
                ? 'bg-primary text-white shadow-sm'
                : 'text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white',
            ]"
          >
            <span class="flex items-center justify-center gap-2">
              <component :is="tab.icon" class="h-5 w-5" />
              {{ tab.label }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white shadow-md dark:bg-boxdark">
        <!-- Общие настройки -->
        <div v-show="activeTab === 'general'" class="p-6">
          <div class="space-y-6">
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Общие настройки
              </h3>
              <div class="space-y-4">
                <!-- Язык интерфейса -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Язык интерфейса
                  </label>
                  <select v-model="form.language" class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                    <option value="ru">Русский</option>
                    <option value="en">English</option>
                    <option value="uz">O'zbek</option>
                  </select>
                </div>

                <!-- Часовой пояс (пока заглушка, нет в БД, но можно добавить в будущем) -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50 opacity-50 cursor-not-allowed">
                  <label class="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Часовой пояс (недоступно)
                  </label>
                  <select disabled class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 transition-all dark:border-gray-600 dark:bg-gray-900 dark:text-white">
                    <option value="Asia/Tashkent">Asia/Tashkent (UTC+5)</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UiButton variant="primary" size="md" :loading="loading" @click="saveSettings">
                Сохранить изменения
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Уведомления -->
        <div v-show="activeTab === 'notifications'" class="p-6">
          <div class="space-y-6">
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Настройки уведомлений
              </h3>
              <div class="space-y-4">
                <!-- Email уведомления -->
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">Email уведомления</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Получать уведомления на email</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" v-model="form.notifications_email" class="peer sr-only" />
                    <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>

                <!-- Push уведомления -->
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">Push уведомления</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Получать push-уведомления в браузере</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" v-model="form.notifications_push" class="peer sr-only" />
                    <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>

                <!-- SMS уведомления -->
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">SMS уведомления</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Получать SMS на мобильный телефон</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" v-model="form.notifications_sms" class="peer sr-only" />
                    <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UiButton variant="primary" size="md" :loading="loading" @click="saveSettings">
                Сохранить изменения
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Внешний вид -->
        <div v-show="activeTab === 'appearance'" class="p-6">
          <div class="space-y-6">
            <div>
              <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                Настройки внешнего вида
              </h3>
              <div class="space-y-4">
                <!-- Тема -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Тема оформления
                  </label>
                  <div class="grid grid-cols-3 gap-3">
                    <label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900" 
                      :class="form.theme === 'light' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.theme" value="light" class="peer sr-only" />
                      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-white shadow-md ring-1 ring-gray-200">
                        <svg class="h-6 w-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Светлая</span>
                    </label>

                    <label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
                      :class="form.theme === 'dark' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.theme" value="dark" class="peer sr-only" />
                      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-900 shadow-md ring-1 ring-gray-600">
                        <svg class="h-6 w-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Темная</span>
                    </label>

                    <label class="flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 bg-white p-4 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
                      :class="form.theme === 'auto' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.theme" value="auto" class="peer sr-only" />
                      <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-linear-to-br from-white to-gray-900 shadow-md ring-1 ring-gray-400">
                        <svg class="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Авто</span>
                    </label>
                  </div>
                </div>

                <!-- Размер шрифта -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Размер шрифта
                  </label>
                  <div class="flex gap-3">
                    <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
                      :class="form.font_size === 'small' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.font_size" value="small" class="peer sr-only" />
                      <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Маленький</span>
                    </label>
                    <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
                      :class="form.font_size === 'medium' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.font_size" value="medium" class="peer sr-only" />
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Средний</span>
                    </label>
                    <label class="flex flex-1 cursor-pointer items-center justify-center rounded-lg border-2 bg-white px-4 py-3 transition-all hover:border-primary focus-within:border-primary dark:bg-gray-900"
                      :class="form.font_size === 'large' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300 dark:border-gray-600'">
                      <input type="radio" v-model="form.font_size" value="large" class="peer sr-only" />
                      <span class="text-base font-medium text-gray-700 dark:text-gray-300">Большой</span>
                    </label>
                  </div>
                </div>

                <!-- Компактный режим -->
                <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <div>
                    <h4 class="font-medium text-gray-900 dark:text-white">Компактный режим</h4>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Уменьшить отступы и размеры элементов</p>
                  </div>
                  <label class="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" v-model="form.compact_mode" class="peer sr-only" />
                    <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
                  </label>
                </div>

                <!-- Цвет боковой панели -->
                <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 transition-all hover:border-primary/50 dark:border-gray-700 dark:bg-gray-800/50">
                  <label class="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Цвет боковой панели
                  </label>
                  <div class="flex gap-3">
                    <label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
                      :class="form.sidebar_color === 'default' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'">
                      <input type="radio" v-model="form.sidebar_color" value="default" class="peer sr-only" />
                      <div class="h-8 w-8 rounded-md bg-gray-900 ring-2 ring-gray-300 peer-checked:ring-primary"></div>
                    </label>
                    <label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
                      :class="form.sidebar_color === 'primary' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'">
                      <input type="radio" v-model="form.sidebar_color" value="primary" class="peer sr-only" />
                      <div class="h-8 w-8 rounded-md bg-primary ring-2 ring-gray-300 peer-checked:ring-primary"></div>
                    </label>
                    <label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
                      :class="form.sidebar_color === 'success' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'">
                      <input type="radio" v-model="form.sidebar_color" value="success" class="peer sr-only" />
                      <div class="h-8 w-8 rounded-md bg-success ring-2 ring-gray-300 peer-checked:ring-primary"></div>
                    </label>
                    <label class="flex h-12 w-12 cursor-pointer items-center justify-center rounded-lg border-2 bg-white transition-all hover:border-primary focus-within:border-primary"
                      :class="form.sidebar_color === 'purple' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-300'">
                      <input type="radio" v-model="form.sidebar_color" value="purple" class="peer sr-only" />
                      <div class="h-8 w-8 rounded-md bg-purple-600 ring-2 ring-gray-300 peer-checked:ring-primary"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-end gap-3 pt-4">
              <UiButton variant="primary" size="md" :loading="loading" @click="saveSettings">
                Применить изменения
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Расписание -->
        <div v-show="activeTab === 'schedule'" class="p-6">
          <SettingsScheduleSettings />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { 
  Settings, 
  Bell, 
  Palette,
  Calendar 
} from 'lucide-vue-next';
import { useUserSettings } from '@/composables/useUserSettings';

// Определяем мета-данные страницы
definePageMeta({
  layout: 'default',
});

useHead({
  title: 'Настройки | TailAdmin - Nuxt Tailwind CSS Dashboard',
});

// Composable для настроек
const { settings, loading, fetchSettings, updateSettings } = useUserSettings();

// Локальная форма
const form = ref({
  theme: 'light',
  language: 'ru',
  notifications_email: true,
  notifications_push: true,
  notifications_sms: false,
  compact_mode: false,
  font_size: 'medium',
  sidebar_color: 'default'
});

// Активная вкладка
const activeTab = ref('general');

// Конфигурация вкладок
const { user } = useAuth();
import { Permission, roleHasPermission } from '~/types/permissions';

// Конфигурация вкладок
const tabs = computed(() => {
  const allTabs = [
    {
      id: 'general',
      label: 'Общие',
      icon: Settings,
    },
    {
      id: 'schedule',
      label: 'Расписание',
      icon: Calendar,
      permission: Permission.SETTINGS_MANAGE
    },
    {
      id: 'notifications',
      label: 'Уведомления',
      icon: Bell,
    },
    {
      id: 'appearance',
      label: 'Внешний вид',
      icon: Palette,
    },
  ];

  return allTabs.filter(tab => {
    if (tab.permission) {
      return user.value && roleHasPermission(user.value.role, tab.permission);
    }
    return true;
  });
});

// Загрузка настроек при монтировании
onMounted(async () => {
  await fetchSettings();
});

// Обновление формы при загрузке настроек
watch(settings, (newSettings) => {
  if (newSettings) {
    form.value = { ...newSettings };
  }
}, { immediate: true });

// Сохранение настроек
const saveSettings = async () => {
  await updateSettings(form.value);
};
</script>

