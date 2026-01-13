import { c as useState } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
import { computed } from 'vue';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';

const useCertificateIssueStore = () => {
  const isIssuing = useState("cert_issue_is_issuing", () => false);
  const isPaused = useState("cert_issue_is_paused", () => false);
  const currentJob = useState("cert_issue_current_job", () => null);
  const processedCount = useState("cert_issue_processed", () => 0);
  const totalCount = useState("cert_issue_total", () => 0);
  const currentStudentName = useState("cert_issue_current_student", () => "");
  const successCount = useState("cert_issue_success", () => 0);
  const warningCount = useState("cert_issue_warning", () => 0);
  const errorCount = useState("cert_issue_error", () => 0);
  const results = useState("cert_issue_results", () => []);
  const errors = useState("cert_issue_errors", () => []);
  const isCompleted = useState("cert_issue_completed", () => false);
  const { authFetch } = useAuthFetch();
  const { success: showSuccess, error: showError } = useNotification();
  const percentage = computed(() => {
    if (totalCount.value === 0) return 0;
    return Math.round(processedCount.value / totalCount.value * 100);
  });
  const hasActiveIssue = computed(() => {
    return isIssuing.value || isCompleted.value && results.value.length > 0;
  });
  const startBulkIssue = async (job) => {
    if (isIssuing.value) {
      console.warn("[CertificateIssue] Выдача уже выполняется");
      return;
    }
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
    const studentData = job.studentData;
    const processedStudentIds = /* @__PURE__ */ new Set();
    for (let i = 0; i < studentData.length; i++) {
      if (isPaused.value || !isIssuing.value) {
        console.log("[CertificateIssue] Выдача приостановлена или отменена");
        break;
      }
      const student = studentData[i];
      if (processedStudentIds.has(student.id)) {
        console.warn(`[CertificateIssue] Студент ${student.fullName} уже обработан, пропускаем`);
        continue;
      }
      processedStudentIds.add(student.id);
      currentStudentName.value = student.fullName;
      processedCount.value = i + 1;
      try {
        const response = await authFetch(
          `/api/certificates/issue/${job.groupId}`,
          {
            method: "POST",
            body: {
              templateId: job.templateId,
              studentIds: [student.id],
              issueDate: job.issueDate,
              expiryMode: job.expiryMode,
              overrideWarnings: !student.isEligible
            }
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
              error: result.error || "Неизвестная ошибка"
            });
          }
        }
      } catch (e) {
        console.error(`[CertificateIssue] Ошибка выдачи для ${student.fullName}:`, e);
        const errorResult = {
          studentId: student.id,
          studentName: student.fullName,
          success: false,
          error: e.data?.message || e.message || "Ошибка выдачи"
        };
        results.value.push(errorResult);
        errorCount.value++;
        errors.value.push({
          studentName: student.fullName,
          error: errorResult.error
        });
      }
      if (i < studentData.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    isIssuing.value = false;
    isCompleted.value = true;
    currentStudentName.value = "";
    console.log(`[CertificateIssue] Выдача завершена: ${successCount.value} успешно, ${errorCount.value} ошибок`);
    if (successCount.value > 0) {
      showSuccess(`Выдано ${successCount.value} сертификатов для группы ${job.groupCode}`);
    }
    if (errorCount.value > 0) {
      showError(`${errorCount.value} ошибок при выдаче сертификатов`);
    }
  };
  const pauseIssue = () => {
    if (isIssuing.value) {
      isPaused.value = true;
    }
  };
  const cancelIssue = () => {
    isIssuing.value = false;
    isPaused.value = false;
    isCompleted.value = true;
  };
  const reset = () => {
    isIssuing.value = false;
    isPaused.value = false;
    isCompleted.value = false;
    currentJob.value = null;
    processedCount.value = 0;
    totalCount.value = 0;
    currentStudentName.value = "";
    successCount.value = 0;
    warningCount.value = 0;
    errorCount.value = 0;
    results.value = [];
    errors.value = [];
  };
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
    dismissNotification
  };
};

export { useCertificateIssueStore as u };
//# sourceMappingURL=useCertificateIssueStore-C5OIM9Ic.mjs.map
