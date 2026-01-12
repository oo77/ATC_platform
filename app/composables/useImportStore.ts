import type { ImportAnalysis, ImportProgress } from '~/types/import';

// Global state variables (module-level) для singleton behavior polling interval
let pollInterval: ReturnType<typeof setInterval> | null = null;
let pollErrorCount = 0;
const MAX_POLL_ERRORS = 5; // Максимальное количество ошибок перед остановкой polling

export const useImportStore = () => {
  // State - persisted across navigation using useState
  const isImporting = useState<boolean>('import_is_importing', () => false);
  const isAnalyzing = useState<boolean>('import_is_analyzing', () => false);
  const jobId = useState<string | null>('import_job_id', () => null);
  const currentStep = useState<number>('import_current_step', () => 1);
  const fileName = useState<string | null>('import_file_name', () => null);
  const importType = useState<'student' | 'certificate' | null>('import_type', () => null);
  
  // Data State
  const analysis = useState<ImportAnalysis | null>('import_analysis', () => null);
  const progress = useState<ImportProgress | null>('import_progress', () => null);
  const error = useState<string | null>('import_error', () => null);

  const { authFetch } = useAuthFetch();
  const { error: showError } = useNotification();

  /**
   * Полный сброс состояния импорта
   */
  const reset = () => {
    stopPolling();
    isImporting.value = false;
    isAnalyzing.value = false;
    jobId.value = null;
    currentStep.value = 1;
    fileName.value = null;
    importType.value = null;
    analysis.value = null;
    progress.value = null;
    error.value = null;
    pollErrorCount = 0;
  };

  /**
   * Остановка polling без полного сброса
   */
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };

  /**
   * Анализ файла импорта студентов
   */
  const analyzeStudentImport = async (file: File) => {
    isAnalyzing.value = true;
    error.value = null;
    fileName.value = file.name;
    importType.value = 'student';

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch<{ success: boolean; analysis: ImportAnalysis; error?: string }>(
        '/api/students/import/analyze',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.success && response.analysis) {
        analysis.value = response.analysis;
        currentStep.value = 2;
      } else {
        const errorMsg = response.error || 'Ошибка анализа файла';
        error.value = errorMsg;
        showError(errorMsg);
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Ошибка анализа файла';
      console.error('Ошибка анализа файла:', e);
      error.value = errorMsg;
      showError(errorMsg);
    } finally {
      isAnalyzing.value = false;
    }
  };

  /**
   * Выполнение импорта студентов
   */
  const executeStudentImport = async (file: File) => {
    if (!file) {
      showError('Файл не выбран');
      return;
    }

    isImporting.value = true;
    currentStep.value = 3;
    error.value = null;
    pollErrorCount = 0;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await authFetch<{ success: boolean; jobId: string; error?: string }>(
        '/api/students/import/execute',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.success && response.jobId) {
        jobId.value = response.jobId;
        startPolling();
      } else {
        const errorMsg = response.error || 'Ошибка запуска импорта';
        error.value = errorMsg;
        showError(errorMsg);
        currentStep.value = 2;
        isImporting.value = false;
      }
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : 'Ошибка запуска импорта';
      console.error('Ошибка запуска импорта:', e);
      error.value = errorMsg;
      showError(errorMsg);
      currentStep.value = 2;
      isImporting.value = false;
    }
  };

  /**
   * Запуск polling для отслеживания прогресса
   */
  const startPolling = () => {
    stopPolling();
    pollErrorCount = 0;

    pollInterval = setInterval(async () => {
      if (!jobId.value) {
        stopPolling();
        return;
      }

      try {
        const response = await authFetch<{ success: boolean; status: ImportProgress }>(
          `/api/students/import/status/${jobId.value}`,
          { method: 'GET' }
        );

        if (response.success && response.status) {
          progress.value = response.status;
          pollErrorCount = 0; // Сброс счётчика ошибок при успехе

          // Проверка завершения
          if (response.status.status === 'completed' || response.status.status === 'failed') {
            stopPolling();
            isImporting.value = false;
            currentStep.value = 4;
          }
        }
      } catch (e: unknown) {
        pollErrorCount++;
        console.error(`Ошибка получения статуса импорта (попытка ${pollErrorCount}/${MAX_POLL_ERRORS}):`, e);
        
        // Остановка polling после превышения лимита ошибок
        if (pollErrorCount >= MAX_POLL_ERRORS) {
          stopPolling();
          error.value = 'Потеряна связь с сервером. Проверьте статус импорта вручную.';
          showError('Потеряна связь с сервером');
        }
      }
    }, 1000);
  };

  /**
   * Отмена импорта и сброс состояния
   */
  const cancelImport = () => {
    reset();
  };
  
  /**
   * Вычисляемый процент прогресса для UI
   */
  const percentage = computed(() => {
    if (!progress.value || !progress.value.totalRows) return 0;
    return Math.round((progress.value.processedRows / progress.value.totalRows) * 100);
  });

  /**
   * Флаг: есть ли активная импортная сессия
   */
  const hasActiveSession = computed(() => {
    return isImporting.value || currentStep.value > 1;
  });

  return {
    // State
    isImporting,
    isAnalyzing,
    jobId,
    currentStep,
    fileName,
    analysis,
    progress,
    error,
    importType,
    
    // Computed
    percentage,
    hasActiveSession,

    // Actions
    analyzeStudentImport,
    executeStudentImport,
    cancelImport,
    reset,
    startPolling,
    stopPolling,
  };
};
