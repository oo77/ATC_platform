/**
 * Глобальный store для отслеживания массовой выдачи сертификатов.
 * Позволяет продолжать выдачу при переходе между страницами и
 * отображать статус в панели уведомлений.
 */

export interface CertificateIssueResult {
  studentId: string;
  studentName: string;
  success: boolean;
  certificateId?: string;
  certificateNumber?: string;
  warnings?: any[];
  error?: string;
}

export interface CertificateIssueJob {
  groupId: string;
  groupCode: string;
  courseName: string;
  templateId: string;
  templateName: string;
  issueDate: string;
  studentIds: string[];
  studentData: Array<{
    id: string;
    fullName: string;
    isEligible: boolean;
  }>;
  expiryMode: 'auto' | 'none';
}

export const useCertificateIssueStore = () => {
  // State - persisted across navigation using useState
  const isIssuing = useState<boolean>('cert_issue_is_issuing', () => false);
  const isPaused = useState<boolean>('cert_issue_is_paused', () => false);
  const currentJob = useState<CertificateIssueJob | null>('cert_issue_current_job', () => null);
  
  // Progress
  const processedCount = useState<number>('cert_issue_processed', () => 0);
  const totalCount = useState<number>('cert_issue_total', () => 0);
  const currentStudentName = useState<string>('cert_issue_current_student', () => '');
  
  // Results
  const successCount = useState<number>('cert_issue_success', () => 0);
  const warningCount = useState<number>('cert_issue_warning', () => 0);
  const errorCount = useState<number>('cert_issue_error', () => 0);
  const results = useState<CertificateIssueResult[]>('cert_issue_results', () => []);
  const errors = useState<Array<{ studentName: string; error: string }>>('cert_issue_errors', () => []);
  
  // Completion flag
  const isCompleted = useState<boolean>('cert_issue_completed', () => false);

  const { authFetch } = useAuthFetch();
  const { success: showSuccess, error: showError } = useNotification();

  // Computed
  const percentage = computed(() => {
    if (totalCount.value === 0) return 0;
    return Math.round((processedCount.value / totalCount.value) * 100);
  });

  const hasActiveIssue = computed(() => {
    return isIssuing.value || (isCompleted.value && results.value.length > 0);
  });

  /**
   * Запуск массовой выдачи сертификатов
   */
  const startBulkIssue = async (job: CertificateIssueJob) => {
    if (isIssuing.value) {
      console.warn('[CertificateIssue] Выдача уже выполняется');
      return;
    }

    // Инициализация
    currentJob.value = job;
    totalCount.value = job.studentIds.length;
    processedCount.value = 0;
    successCount.value = 0;
    warningCount.value = 0;
    errorCount.value = 0;
    results.value = [];
    errors.value = [];
    isCompleted.value = false;
    isPaused.value = false;
    isIssuing.value = true;

    console.log(`[CertificateIssue] Начинаем массовую выдачу: ${job.studentIds.length} студентов для группы ${job.groupCode}`);

    // Получаем данные студентов
    const studentData = job.studentData;
    const processedStudentIds = new Set<string>();

    for (let i = 0; i < studentData.length; i++) {
      // Проверка на паузу или отмену
      if (isPaused.value || !isIssuing.value) {
        console.log('[CertificateIssue] Выдача приостановлена или отменена');
        break;
      }

      const student = studentData[i];
      
      // Пропускаем если уже обработали
      if (processedStudentIds.has(student.id)) {
        console.warn(`[CertificateIssue] Студент ${student.fullName} уже обработан, пропускаем`);
        continue;
      }
      
      processedStudentIds.add(student.id);
      
      // Обновляем прогресс
      currentStudentName.value = student.fullName;
      processedCount.value = i + 1;

      try {
        const response = await authFetch<{
          success: boolean;
          results: CertificateIssueResult[];
          message?: string;
        }>(
          `/api/certificates/issue/${job.groupId}`,
          {
            method: 'POST',
            body: {
              templateId: job.templateId,
              studentIds: [student.id],
              issueDate: job.issueDate,
              expiryMode: job.expiryMode,
              overrideWarnings: !student.isEligible,
            },
          }
        );

        if (response.success && response.results.length > 0) {
          const result = response.results[0];
          results.value.push(result);
          
          if (result.success) {
            if (result.warnings && result.warnings.length > 0) {
              warningCount.value++;
            } else {
              successCount.value++;
            }
          } else {
            errorCount.value++;
            errors.value.push({
              studentName: result.studentName,
              error: result.error || 'Неизвестная ошибка',
            });
          }
        }
      } catch (e: any) {
        console.error(`[CertificateIssue] Ошибка выдачи для ${student.fullName}:`, e);
        const errorResult: CertificateIssueResult = {
          studentId: student.id,
          studentName: student.fullName,
          success: false,
          error: e.data?.message || e.message || 'Ошибка выдачи',
        };
        results.value.push(errorResult);
        errorCount.value++;
        errors.value.push({
          studentName: student.fullName,
          error: errorResult.error!,
        });
      }

      // Небольшая задержка между запросами для снижения нагрузки
      if (i < studentData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Завершение
    isIssuing.value = false;
    isCompleted.value = true;
    currentStudentName.value = '';

    console.log(`[CertificateIssue] Выдача завершена: ${successCount.value} успешно, ${errorCount.value} ошибок`);

    // Показываем уведомление
    if (successCount.value > 0) {
      showSuccess(`Выдано ${successCount.value} сертификатов для группы ${job.groupCode}`);
    }
    if (errorCount.value > 0) {
      showError(`${errorCount.value} ошибок при выдаче сертификатов`);
    }
  };

  /**
   * Приостановка выдачи
   */
  const pauseIssue = () => {
    if (isIssuing.value) {
      isPaused.value = true;
    }
  };

  /**
   * Отмена выдачи
   */
  const cancelIssue = () => {
    isIssuing.value = false;
    isPaused.value = false;
    isCompleted.value = true; // Помечаем как завершённую чтобы показать результаты
  };

  /**
   * Сброс состояния (очистка после просмотра результатов)
   */
  const reset = () => {
    isIssuing.value = false;
    isPaused.value = false;
    isCompleted.value = false;
    currentJob.value = null;
    processedCount.value = 0;
    totalCount.value = 0;
    currentStudentName.value = '';
    successCount.value = 0;
    warningCount.value = 0;
    errorCount.value = 0;
    results.value = [];
    errors.value = [];
  };

  /**
   * Закрытие уведомления (очистка только если завершено)
   */
  const dismissNotification = () => {
    if (isCompleted.value && !isIssuing.value) {
      reset();
    }
  };

  return {
    // State
    isIssuing,
    isPaused,
    isCompleted,
    currentJob,
    
    // Progress
    processedCount,
    totalCount,
    currentStudentName,
    
    // Results
    successCount,
    warningCount,
    errorCount,
    results,
    errors,
    
    // Computed
    percentage,
    hasActiveIssue,

    // Actions
    startBulkIssue,
    pauseIssue,
    cancelIssue,
    reset,
    dismissNotification,
  };
};
