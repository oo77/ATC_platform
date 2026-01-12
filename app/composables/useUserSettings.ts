export interface UserSettings {
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  language: 'ru' | 'en' | 'uz';
  notifications_email: boolean;
  notifications_push: boolean;
  notifications_sms: boolean;
  compact_mode: boolean;
  font_size: 'small' | 'medium' | 'large';
  sidebar_color?: string;
  updated_at: Date;
}

export const useUserSettings = () => {
  const settings = useState<UserSettings | null>('user-settings', () => null);
  const loading = useState<boolean>('user-settings-loading', () => false);
  const { authFetch } = useAuthFetch();

  /**
   * Загрузка настроек с сервера
   */
  const fetchSettings = async () => {
    loading.value = true;
    try {
      const data = await authFetch<UserSettings>('/api/profile/settings');
      if (data) {
        settings.value = data;
        applySettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      useNotification().error('Не удалось загрузить настройки');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Обновление настроек
   */
  const updateSettings = async (newSettings: Partial<UserSettings>) => {
    loading.value = true;
    try {
      const data = await authFetch<UserSettings>('/api/profile/settings', {
        method: 'PUT',
        body: newSettings,
      });

      if (data) {
        settings.value = data;
        applySettings(data);
        useNotification().success('Настройки сохранены');
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      useNotification().error('Ошибка при сохранении настроек');
    } finally {
      loading.value = false;
    }
  };

  /**
   * Применение настроек (тема, режим и т.д.)
   * Безопасно работает как на сервере, так и на клиенте
   */
  const applySettings = (s: UserSettings) => {
    // Все DOM-манипуляции только на клиенте
    if (!import.meta.client) return;

    // 1. Тема — используем существующий useTheme composable
    // Получаем состояние isDarkMode из useState напрямую для совместимости
    const isDarkModeState = useState<boolean>('dark-mode');

    if (s.theme === 'auto') {
      // Для auto — определяем по системным настройкам
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      isDarkModeState.value = prefersDark;
    } else {
      isDarkModeState.value = s.theme === 'dark';
    }

    // Применяем класс dark к document
    if (isDarkModeState.value) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Сохраняем в localStorage для useTheme
    localStorage.setItem('theme', isDarkModeState.value ? 'dark' : 'light');

    // 2. Компактный режим
    if (s.compact_mode) {
      document.documentElement.classList.add('compact-mode');
    } else {
      document.documentElement.classList.remove('compact-mode');
    }

    // 3. Размер шрифта
    document.documentElement.setAttribute('data-font-size', s.font_size);

    // 4. Цвет боковой панели
    const sidebarColor = s.sidebar_color || 'default';
    document.documentElement.setAttribute('data-sidebar-color', sidebarColor);
  };

  // Инициализация при создании composable (опционально, лучше вызывать явно в компоненте)
  // if (!settings.value) fetchSettings();

  return {
    settings,
    loading,
    fetchSettings,
    updateSettings,
  };
};
