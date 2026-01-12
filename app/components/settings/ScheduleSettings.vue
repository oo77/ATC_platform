<template>
  <div class="space-y-6">
    <div>
      <h3 class="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
        Настройки расписания
      </h3>
      <p class="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Настройте академические часы и перерывы для учебного расписания
      </p>

      <!-- Загрузка -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-primary border-r-transparent"></div>
          <span class="text-gray-600 dark:text-gray-400">Загрузка настроек...</span>
        </div>
      </div>

      <div v-else class="space-y-6">
        <!-- Общие настройки -->
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <h4 class="mb-4 font-medium text-gray-900 dark:text-white">Общие настройки</h4>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <!-- Привязка к академическим часам -->
            <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <div>
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">Привязка к парам</h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">Привязывать события к академическим часам</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" v-model="localSettings.snap_to_periods" class="peer sr-only" />
                <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
            </div>

            <!-- Показывать номера пар -->
            <div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <div>
                <h5 class="text-sm font-medium text-gray-900 dark:text-white">Показывать номера пар</h5>
                <p class="text-xs text-gray-500 dark:text-gray-400">Отображать номера пар в календаре</p>
              </div>
              <label class="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" v-model="localSettings.show_period_numbers" class="peer sr-only" />
                <div class="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-primary/20 dark:border-gray-600 dark:bg-gray-700"></div>
              </label>
            </div>

            <!-- Длительность пары -->
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Длительность ак. часа (мин)
              </label>
              <input 
                type="number" 
                v-model="localSettings.period_duration_minutes"
                min="30"
                max="60"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"
              />
            </div>

            <!-- Длительность перерыва -->
            <div class="rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-600 dark:bg-gray-900">
              <label class="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Перерыв между парами (мин)
              </label>
              <input 
                type="number" 
                v-model="localSettings.short_break_minutes"
                min="5"
                max="30"
                class="w-full rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"
              />
            </div>
          </div>
        </div>

        <!-- Академические пары -->
        <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-medium text-gray-900 dark:text-white">Академические пары</h4>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {{ localPeriods.length }} пар
            </span>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200 dark:border-gray-600">
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">№</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Начало</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Окончание</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">После перерыва</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="period in localPeriods" 
                  :key="period.periodNumber"
                  class="border-b border-gray-100 dark:border-gray-700"
                  :class="{ 'bg-yellow-50 dark:bg-yellow-900/20': period.isAfterBreak }"
                >
                  <td class="px-3 py-2">
                    <span class="inline-flex items-center justify-center w-6 h-6 bg-primary/10 text-primary rounded font-medium text-xs">
                      {{ period.periodNumber }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <input 
                      type="time" 
                      v-model="period.startTime"
                      class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"
                    />
                  </td>
                  <td class="px-3 py-2">
                    <input 
                      type="time" 
                      v-model="period.endTime"
                      class="rounded border border-gray-300 bg-white px-2 py-1 text-sm outline-none focus:border-primary dark:border-gray-600 dark:bg-gray-800"
                    />
                  </td>
                  <td class="px-3 py-2 text-center">
                    <label class="relative inline-flex cursor-pointer items-center">
                      <input type="checkbox" v-model="period.isAfterBreak" class="peer sr-only" />
                      <div class="peer h-5 w-9 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-warning peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:ring-2 peer-focus:ring-warning/20 dark:border-gray-600 dark:bg-gray-700"></div>
                    </label>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Подсказка -->
          <div class="mt-4 flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <svg class="w-5 h-5 text-blue-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Отметьте "После перерыва" для пар, которые начинаются после большого перерыва (обеда).
              Это добавит визуальное разделение в календаре.
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 pt-4">
      <UiButton variant="outline" size="md" @click="resetToDefaults" :disabled="saving">
        Сбросить
      </UiButton>
      <UiButton variant="primary" size="md" @click="saveSettings" :disabled="saving">
        <span v-if="saving" class="flex items-center gap-2">
          <div class="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
          Сохранение...
        </span>
        <span v-else>Сохранить изменения</span>
      </UiButton>
    </div>
  </div>
</template>

<script setup lang="ts">
const notification = useNotification();
const { 
  periods, 
  settings, 
  loading, 
  loadSettings, 
  updatePeriods, 
  updateSettings, 
  resetCache 
} = useScheduleSettings();

const saving = ref(false);

// Локальные копии для редактирования
const localPeriods = ref<Array<{
  periodNumber: number;
  startTime: string;
  endTime: string;
  isAfterBreak: boolean;
}>>([]);

const localSettings = ref<{
  snap_to_periods: boolean;
  show_period_numbers: boolean;
  period_duration_minutes: string;
  short_break_minutes: string;
}>({
  snap_to_periods: true,
  show_period_numbers: true,
  period_duration_minutes: '40',
  short_break_minutes: '10',
});

// Инициализация
onMounted(async () => {
  await loadSettings();
  initLocalValues();
});

const initLocalValues = () => {
  // Копируем периоды
  localPeriods.value = periods.value.map(p => ({
    periodNumber: p.periodNumber,
    startTime: p.startTime,
    endTime: p.endTime,
    isAfterBreak: p.isAfterBreak,
  }));

  // Копируем настройки
  localSettings.value = {
    snap_to_periods: settings.value.snap_to_periods === 'true',
    show_period_numbers: settings.value.show_period_numbers === 'true',
    period_duration_minutes: settings.value.period_duration_minutes || '40',
    short_break_minutes: settings.value.short_break_minutes || '10',
  };
};

const saveSettings = async () => {
  saving.value = true;

  try {
    // Сохраняем периоды
    const periodsSuccess = await updatePeriods(localPeriods.value);
    
    // Сохраняем настройки
    const settingsData = [
      { key: 'snap_to_periods', value: localSettings.value.snap_to_periods ? 'true' : 'false' },
      { key: 'show_period_numbers', value: localSettings.value.show_period_numbers ? 'true' : 'false' },
      { key: 'period_duration_minutes', value: localSettings.value.period_duration_minutes },
      { key: 'short_break_minutes', value: localSettings.value.short_break_minutes },
    ];
    const settingsSuccess = await updateSettings(settingsData);

    if (periodsSuccess && settingsSuccess) {
      notification.show({
        type: 'success',
        title: 'Сохранено',
        message: 'Настройки расписания успешно сохранены',
      });
    } else {
      throw new Error('Не все настройки удалось сохранить');
    }
  } catch (error: any) {
    console.error('Ошибка сохранения:', error);
    notification.show({
      type: 'error',
      title: 'Ошибка',
      message: error.message || 'Не удалось сохранить настройки',
    });
  } finally {
    saving.value = false;
  }
};

const resetToDefaults = () => {
  resetCache();
  initLocalValues();
  notification.show({
    type: 'info',
    title: 'Сброшено',
    message: 'Настройки сброшены к значениям по умолчанию. Не забудьте сохранить.',
  });
};
</script>
