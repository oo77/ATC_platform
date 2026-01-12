/**
 * Композабл для работы с настройками расписания (академические пары)
 */

export interface SchedulePeriod {
  id: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isAfterBreak: boolean;
  isActive: boolean;
}

export interface ScheduleSettingsData {
  periods: SchedulePeriod[];
  settings: Record<string, string>;
}

// Дефолтные настройки на случай если БД недоступна
const DEFAULT_PERIODS: SchedulePeriod[] = [
  { id: 1, periodNumber: 1, startTime: '09:00', endTime: '09:40', isAfterBreak: false, isActive: true },
  { id: 2, periodNumber: 2, startTime: '09:40', endTime: '10:20', isAfterBreak: false, isActive: true },
  { id: 3, periodNumber: 3, startTime: '10:30', endTime: '11:10', isAfterBreak: false, isActive: true },
  { id: 4, periodNumber: 4, startTime: '11:10', endTime: '11:50', isAfterBreak: false, isActive: true },
  { id: 5, periodNumber: 5, startTime: '12:00', endTime: '12:40', isAfterBreak: false, isActive: true },
  { id: 6, periodNumber: 6, startTime: '12:40', endTime: '13:20', isAfterBreak: false, isActive: true },
  { id: 7, periodNumber: 7, startTime: '14:00', endTime: '14:40', isAfterBreak: true, isActive: true },
  { id: 8, periodNumber: 8, startTime: '14:40', endTime: '15:20', isAfterBreak: false, isActive: true },
  { id: 9, periodNumber: 9, startTime: '15:30', endTime: '16:10', isAfterBreak: false, isActive: true },
  { id: 10, periodNumber: 10, startTime: '16:10', endTime: '16:50', isAfterBreak: false, isActive: true },
  { id: 11, periodNumber: 11, startTime: '17:00', endTime: '17:40', isAfterBreak: false, isActive: true },
  { id: 12, periodNumber: 12, startTime: '17:40', endTime: '18:20', isAfterBreak: false, isActive: true },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  lunch_break_start: '13:20',
  lunch_break_end: '14:00',
  period_duration_minutes: '40',
  short_break_minutes: '10',
  snap_to_periods: 'true',
  show_period_numbers: 'true',
};

export const useScheduleSettings = () => {
  const { authFetch } = useAuthFetch();

  // Состояние
  const periods = useState<SchedulePeriod[]>('schedule-periods', () => [...DEFAULT_PERIODS]);
  const settings = useState<Record<string, string>>('schedule-settings', () => ({ ...DEFAULT_SETTINGS }));
  const loading = useState<boolean>('schedule-settings-loading', () => false);
  const loaded = useState<boolean>('schedule-settings-loaded', () => false);

  /**
   * Загрузить настройки с сервера
   */
  const loadSettings = async (): Promise<ScheduleSettingsData> => {
    if (loaded.value) {
      return { periods: periods.value, settings: settings.value };
    }

    loading.value = true;

    try {
      const response = await authFetch<{
        success: boolean;
        periods: SchedulePeriod[];
        settings: Record<string, string>;
      }>('/api/schedule/settings');

      if (response.success) {
        periods.value = response.periods;
        settings.value = response.settings;
        loaded.value = true;
      }

      return { periods: periods.value, settings: settings.value };
    } catch (error) {
      console.error('[useScheduleSettings] Ошибка загрузки настроек:', error);
      // Используем дефолтные значения
      return { periods: DEFAULT_PERIODS, settings: DEFAULT_SETTINGS };
    } finally {
      loading.value = false;
    }
  };

  /**
   * Обновить академические пары
   */
  const updatePeriods = async (
    updatedPeriods: Array<{ periodNumber: number; startTime: string; endTime: string; isAfterBreak?: boolean }>
  ): Promise<boolean> => {
    loading.value = true;

    try {
      const response = await authFetch<{
        success: boolean;
        periods: SchedulePeriod[];
      }>('/api/schedule/periods', {
        method: 'PUT',
        body: { periods: updatedPeriods },
      });

      if (response.success) {
        periods.value = response.periods;
        return true;
      }

      return false;
    } catch (error) {
      console.error('[useScheduleSettings] Ошибка обновления периодов:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Обновить настройки расписания
   */
  const updateSettings = async (
    updatedSettings: Array<{ key: string; value: string }>
  ): Promise<boolean> => {
    loading.value = true;

    try {
      await authFetch('/api/schedule/settings', {
        method: 'PUT',
        body: { settings: updatedSettings },
      });

      // Обновляем локальное состояние
      for (const setting of updatedSettings) {
        settings.value[setting.key] = setting.value;
      }

      return true;
    } catch (error) {
      console.error('[useScheduleSettings] Ошибка обновления настроек:', error);
      return false;
    } finally {
      loading.value = false;
    }
  };

  /**
   * Получить время начала первой пары
   */
  const getFirstPeriodStart = computed(() => {
    if (periods.value.length === 0) return '09:00';
    return periods.value[0]?.startTime ?? '09:00';
  });

  /**
   * Получить время окончания последней пары
   */
  const getLastPeriodEnd = computed(() => {
    if (periods.value.length === 0) return '18:20';
    const lastPeriod = periods.value[periods.value.length - 1];
    return lastPeriod?.endTime ?? '18:20';
  });

  /**
   * Получить пару по времени
   */
  const getPeriodByTime = (time: string): SchedulePeriod | null => {
    const timeParts = time.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const timeInMinutes = hours * 60 + minutes;

    for (const period of periods.value) {
      const startParts = period.startTime.split(':').map(Number);
      const endParts = period.endTime.split(':').map(Number);
      const startHours = startParts[0] ?? 0;
      const startMinutes = startParts[1] ?? 0;
      const endHours = endParts[0] ?? 0;
      const endMinutes = endParts[1] ?? 0;
      const startInMinutes = startHours * 60 + startMinutes;
      const endInMinutes = endHours * 60 + endMinutes;

      if (timeInMinutes >= startInMinutes && timeInMinutes < endInMinutes) {
        return period;
      }
    }

    return null;
  };

  /**
   * Получить ближайшую пару к времени
   */
  const getNearestPeriod = (time: string): SchedulePeriod | null => {
    if (periods.value.length === 0) return null;

    const timeParts = time.split(':').map(Number);
    const hours = timeParts[0] ?? 0;
    const minutes = timeParts[1] ?? 0;
    const timeInMinutes = hours * 60 + minutes;

    let nearestPeriod: SchedulePeriod | null = null;
    let minDiff = Infinity;

    for (const period of periods.value) {
      const startParts = period.startTime.split(':').map(Number);
      const startHours = startParts[0] ?? 0;
      const startMinutes = startParts[1] ?? 0;
      const startInMinutes = startHours * 60 + startMinutes;
      const diff = Math.abs(timeInMinutes - startInMinutes);

      if (diff < minDiff) {
        minDiff = diff;
        nearestPeriod = period;
      }
    }

    return nearestPeriod;
  };

  /**
   * Получить время начала для номера пары
   */
  const getPeriodStartTime = (periodNumber: number): string | null => {
    const period = periods.value.find(p => p.periodNumber === periodNumber);
    return period ? period.startTime : null;
  };

  /**
   * Получить время окончания для номера пары
   */
  const getPeriodEndTime = (periodNumber: number): string | null => {
    const period = periods.value.find(p => p.periodNumber === periodNumber);
    return period ? period.endTime : null;
  };

  /**
   * Привязать время к началу ближайшей пары
   */
  const snapToNearestPeriodStart = (time: string): string => {
    const shouldSnap = settings.value.snap_to_periods === 'true';
    if (!shouldSnap) return time;

    const nearestPeriod = getNearestPeriod(time);
    return nearestPeriod ? nearestPeriod.startTime : time;
  };

  /**
   * Привязать время к концу ближайшей пары
   */
  const snapToNearestPeriodEnd = (time: string): string => {
    const shouldSnap = settings.value.snap_to_periods === 'true';
    if (!shouldSnap) return time;

    const period = getPeriodByTime(time);
    return period ? period.endTime : time;
  };

  /**
   * Получить слоты для FullCalendar (разделители)
   * Возвращает массив времён, где начинаются пары
   */
  const getSlotLabels = computed(() => {
    return periods.value.map(p => ({
      time: p.startTime,
      label: `${p.periodNumber} пара`,
      isAfterBreak: p.isAfterBreak,
    }));
  });

  /**
   * Проверить, является ли время началом большого перерыва
   */
  const isLunchBreakStart = (time: string): boolean => {
    return time === settings.value.lunch_break_start;
  };

  /**
   * Проверить, является ли время после большого перерыва
   */
  const isAfterLunchBreak = (time: string): boolean => {
    const period = periods.value.find(p => p.startTime === time);
    return period?.isAfterBreak || false;
  };

  /**
   * Сбросить кэш для перезагрузки настроек
   */
  const resetCache = () => {
    loaded.value = false;
    periods.value = [...DEFAULT_PERIODS];
    settings.value = { ...DEFAULT_SETTINGS };
  };

  return {
    // Состояние
    periods,
    settings,
    loading,

    // Методы
    loadSettings,
    updatePeriods,
    updateSettings,
    resetCache,

    // Геттеры
    getFirstPeriodStart,
    getLastPeriodEnd,
    getSlotLabels,

    // Хелперы
    getPeriodByTime,
    getNearestPeriod,
    getPeriodStartTime,
    getPeriodEndTime,
    snapToNearestPeriodStart,
    snapToNearestPeriodEnd,
    isLunchBreakStart,
    isAfterLunchBreak,
  };
};
