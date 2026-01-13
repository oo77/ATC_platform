import { c as useState } from './server.mjs';
import { u as useAuthFetch } from './useAuthFetch-pXCaAdz0.mjs';
import { computed } from 'vue';
import { u as useNotification } from './useNotification-B8oxL3PM.mjs';
import { s as setInterval } from './interval-CUTXZwGJ.mjs';

let pollInterval = null;
const useImportStore = () => {
  const isImporting = useState("import_is_importing", () => false);
  const isAnalyzing = useState("import_is_analyzing", () => false);
  const jobId = useState("import_job_id", () => null);
  const currentStep = useState("import_current_step", () => 1);
  const fileName = useState("import_file_name", () => null);
  const importType = useState("import_type", () => null);
  const analysis = useState("import_analysis", () => null);
  const progress = useState("import_progress", () => null);
  const error = useState("import_error", () => null);
  const { authFetch } = useAuthFetch();
  const { error: showError } = useNotification();
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
  };
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  };
  const analyzeStudentImport = async (file) => {
    isAnalyzing.value = true;
    error.value = null;
    fileName.value = file.name;
    importType.value = "student";
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await authFetch(
        "/api/students/import/analyze",
        {
          method: "POST",
          body: formData
        }
      );
      if (response.success && response.analysis) {
        analysis.value = response.analysis;
        currentStep.value = 2;
      } else {
        const errorMsg = response.error || "Ошибка анализа файла";
        error.value = errorMsg;
        showError(errorMsg);
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Ошибка анализа файла";
      console.error("Ошибка анализа файла:", e);
      error.value = errorMsg;
      showError(errorMsg);
    } finally {
      isAnalyzing.value = false;
    }
  };
  const executeStudentImport = async (file) => {
    if (!file) {
      showError("Файл не выбран");
      return;
    }
    isImporting.value = true;
    currentStep.value = 3;
    error.value = null;
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await authFetch(
        "/api/students/import/execute",
        {
          method: "POST",
          body: formData
        }
      );
      if (response.success && response.jobId) {
        jobId.value = response.jobId;
        startPolling();
      } else {
        const errorMsg = response.error || "Ошибка запуска импорта";
        error.value = errorMsg;
        showError(errorMsg);
        currentStep.value = 2;
        isImporting.value = false;
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : "Ошибка запуска импорта";
      console.error("Ошибка запуска импорта:", e);
      error.value = errorMsg;
      showError(errorMsg);
      currentStep.value = 2;
      isImporting.value = false;
    }
  };
  const startPolling = () => {
    stopPolling();
    pollInterval = setInterval();
  };
  const cancelImport = () => {
    reset();
  };
  const percentage = computed(() => {
    if (!progress.value || !progress.value.totalRows) return 0;
    return Math.round(progress.value.processedRows / progress.value.totalRows * 100);
  });
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
    stopPolling
  };
};

export { useImportStore as u };
//# sourceMappingURL=useImportStore-C7uKAALi.mjs.map
