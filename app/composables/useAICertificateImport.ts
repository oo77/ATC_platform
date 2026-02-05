import { ref, computed } from "vue";
import type {
  AIProcessingResult,
  ExtractedCertificateData,
  StudentMatchResult,
  UploadFileResult,
  ConfirmImportResult,
  AIImportStats,
  PaginatedLogs,
  LogFilters,
  ConfirmImportInput,
  BatchUploadResult,
  BatchAnalysisResult,
  BatchAIProcessingResult,
  BatchConfirmInput,
  BatchConfirmResult,
  CertificateImportItem,
} from "~/../server/types/aiCertificateImport";
import type { Student } from "~/../server/types/student";

export const useAICertificateImport = () => {
  const { authFetch } = useAuthFetch();
  const toast = useToast();

  // --- Single Mode State ---
  const currentStep = ref(1);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Single Import Data State
  const uploadedFile = ref<UploadFileResult | null>(null);
  const analysisResult = ref<AIProcessingResult | null>(null);
  const editedData = ref<ExtractedCertificateData | null>(null);
  const selectedStudent = ref<Student | null>(null);
  const matchResult = ref<StudentMatchResult | null>(null);
  const importConfirmation = ref<ConfirmImportResult | null>(null);

  // --- Batch Mode State ---
  const batchMode = ref(false);
  const batchItems = ref<CertificateImportItem[]>([]);
  const batchCurrentStep = ref(1); // 1: upload, 2: analyze, 3: select, 4: confirm, 5: done
  const batchStats = ref({
    totalFiles: 0,
    analyzedFiles: 0,
    readyFiles: 0,
    errorFiles: 0,
    totalCost: "0.00",
    totalTime: 0,
  });

  // --- Actions ---

  /**
   * Сброс состояния (новый импорт)
   */
  const reset = () => {
    currentStep.value = 1;
    isProcessing.value = false;
    error.value = null;
    uploadedFile.value = null;
    analysisResult.value = null;
    editedData.value = null;
    selectedStudent.value = null;
    matchResult.value = null;
    importConfirmation.value = null;
  };

  /**
   * Шаг 1: Загрузка файла
   */
  const uploadFile = async (file: File) => {
    isProcessing.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      formData.append("file", file);

      const result = await authFetch<UploadFileResult>(
        "/api/ai-certificates/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      uploadedFile.value = result;
      currentStep.value = 2; // Auto-advance optional, or manual
      return result;
    } catch (e: any) {
      const msg = e.data?.message || e.message || "Ошибка загрузки файла";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Шаг 2: AI Анализ
   */
  const analyzeFile = async () => {
    if (!uploadedFile.value?.fileId) {
      error.value = "Файл не загружен";
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const result = await authFetch<AIProcessingResult>(
        "/api/ai-certificates/analyze",
        {
          method: "POST",
          body: { fileId: uploadedFile.value.fileId },
        },
      );

      analysisResult.value = result;
      // Инициализируем редактируемые данные копией результата
      editedData.value = { ...result.extractedData };

      // Если есть совпадение по студенту, устанавливаем его
      matchResult.value = result.matchResult;
      if (result.matchResult && result.matchResult.student) {
        selectedStudent.value = result.matchResult.student;
      }

      currentStep.value = 3;
      return result;
    } catch (e: any) {
      console.error(e);
      const msg = e.data?.message || e.message || "Ошибка анализа файла";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Шаг 3: Обновление данных (локально)
   */
  const updateExtractedData = (data: ExtractedCertificateData) => {
    editedData.value = data;
  };

  /**
   * Шаг 4: Поиск студентов (для ручного выбора)
   */
  const searchStudents = async (query: string): Promise<Student[]> => {
    if (!query || query.length < 2) return [];

    try {
      return await authFetch<Student[]>(
        "/api/ai-certificates/search-students",
        {
          params: { q: query },
        },
      );
    } catch (e) {
      console.error("Ошибка поиска студентов:", e);
      return [];
    }
  };

  const selectStudent = (student: Student) => {
    selectedStudent.value = student;
  };

  /**
   * Шаг 5: Подтверждение импорта
   */
  const confirmImport = async () => {
    if (
      !uploadedFile.value?.fileId ||
      !selectedStudent.value ||
      !editedData.value
    ) {
      error.value = "Недостаточно данных для подтверждения";
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const payload: ConfirmImportInput = {
        fileId: uploadedFile.value.fileId,
        studentId: selectedStudent.value.id,
        extractedData: analysisResult.value!.extractedData, // Оригинальные данные
        overrideData: editedData.value, // Отредактированные данные (сервер сравнит и сохранит только изменения)
      };

      const result = await authFetch<ConfirmImportResult>(
        "/api/ai-certificates/confirm",
        {
          method: "POST",
          body: payload,
        },
      );

      importConfirmation.value = result;
      toast.success("Сертификат успешно импортирован");
      return result;
    } catch (e: any) {
      const msg =
        e.data?.message || e.message || "Ошибка подтверждения импорта";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  // --- Analytics & Logs ---

  const getStats = async (): Promise<AIImportStats> => {
    try {
      return await authFetch<AIImportStats>("/api/ai-certificates/stats");
    } catch (e) {
      console.error("Ошибка получения статистики:", e);
      throw e;
    }
  };

  const getLogs = async (filters: LogFilters = {}): Promise<PaginatedLogs> => {
    try {
      return await authFetch<PaginatedLogs>("/api/ai-certificates/logs", {
        params: filters,
      });
    } catch (e) {
      console.error("Ошибка получения логов:", e);
      throw e;
    }
  };

  // --- Batch Mode Actions ---

  /**
   * Переключение между single и batch режимами
   */
  const toggleBatchMode = () => {
    batchMode.value = !batchMode.value;
    if (batchMode.value) {
      reset();
      resetBatch();
    } else {
      resetBatch();
      reset();
    }
  };

  /**
   * Сброс batch состояния
   */
  const resetBatch = () => {
    batchItems.value = [];
    batchCurrentStep.value = 1;
    batchStats.value = {
      totalFiles: 0,
      analyzedFiles: 0,
      readyFiles: 0,
      errorFiles: 0,
      totalCost: "0.00",
      totalTime: 0,
    };
    isProcessing.value = false;
    error.value = null;
  };

  /**
   * Batch Шаг 1: Загрузка нескольких файлов
   */
  const uploadBatch = async (files: File[]) => {
    if (files.length === 0) {
      toast.error("Выберите файлы для загрузки");
      return;
    }

    if (files.length > 20) {
      toast.error("Максимум 20 файлов за раз");
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append("files", file);
      });

      const result = await authFetch<BatchUploadResult>(
        "/api/ai-certificates/batch/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      batchItems.value = result.files.map((file) => ({
        file,
        analysisResult: null,
        selectedStudent: null,
        uiStatus: "uploaded" as const,
        isExpanded: false,
      }));

      batchStats.value.totalFiles = result.successCount;

      if (result.errorCount > 0) {
        toast.warning(
          `Загружено ${result.successCount} из ${files.length} файлов`,
        );
      } else {
        toast.success(`Успешно загружено ${result.successCount} файлов`);
      }

      batchCurrentStep.value = 2;
      return result;
    } catch (e: any) {
      const msg = e.data?.message || e.message || "Ошибка загрузки файлов";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Batch Шаг 2: AI-анализ всех файлов
   */
  const analyzeBatch = async () => {
    if (batchItems.value.length === 0) {
      error.value = "Нет файлов для анализа";
      return;
    }

    isProcessing.value = true;
    error.value = null;

    batchItems.value.forEach((item) => {
      item.uiStatus = "analyzing";
    });

    try {
      const fileIds = batchItems.value.map((item) => item.file.fileId);

      const result = await authFetch<BatchAnalysisResult>(
        "/api/ai-certificates/batch/analyze",
        {
          method: "POST",
          body: { fileIds },
        },
      );

      result.results.forEach((analysisResult) => {
        const item = batchItems.value.find(
          (i) => i.file.fileId === analysisResult.fileId,
        );
        if (item) {
          item.analysisResult = analysisResult;

          if (analysisResult.success) {
            item.uiStatus = "analyzed";
            if (
              analysisResult.matchResult?.topAlternatives &&
              analysisResult.matchResult.topAlternatives.length > 0
            ) {
              item.selectedStudent =
                analysisResult.matchResult.topAlternatives[0];
              item.uiStatus = "ready";
            }
          } else {
            item.uiStatus = "error";
          }
        }
      });

      batchStats.value.analyzedFiles = result.successCount;
      batchStats.value.errorFiles = result.errorCount;
      batchStats.value.totalCost = result.totalCost;
      batchStats.value.totalTime = result.totalProcessingTime;
      batchStats.value.readyFiles = batchItems.value.filter(
        (i) => i.uiStatus === "ready",
      ).length;

      if (result.errorCount > 0) {
        toast.warning(
          `Проанализировано ${result.successCount} из ${batchItems.value.length} файлов`,
        );
      } else {
        toast.success(
          `Успешно проанализировано ${result.successCount} файлов`,
        );
      }

      batchCurrentStep.value = 3;
      return result;
    } catch (e: any) {
      const msg = e.data?.message || e.message || "Ошибка анализа файлов";
      error.value = msg;
      toast.error(msg);

      batchItems.value.forEach((item) => {
        if (item.uiStatus === "analyzing") {
          item.uiStatus = "error";
        }
      });

      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  /**
   * Batch Шаг 3: Выбор студента для конкретного файла
   */
  const selectStudentForFile = (fileId: string, student: Student) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item) {
      item.selectedStudent = student;
      item.uiStatus = "ready";
      batchStats.value.readyFiles = batchItems.value.filter(
        (i) => i.uiStatus === "ready",
      ).length;
    }
  };

  /**
   * Обновление извлечённых данных для файла
   */
  const updateBatchItemData = (
    fileId: string,
    data: Partial<ExtractedCertificateData>,
  ) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item?.analysisResult?.extractedData) {
      item.analysisResult.extractedData = {
        ...item.analysisResult.extractedData,
        ...data,
      };
    }
  };

  /**
   * Переключение раскрытия панели
   */
  const toggleItemExpanded = (fileId: string) => {
    const item = batchItems.value.find((i) => i.file.fileId === fileId);
    if (item) {
      item.isExpanded = !item.isExpanded;
    }
  };

  /**
   * Batch Шаг 4: Подтверждение импорта всех готовых файлов
   */
  const confirmBatchImport = async () => {
    const readyItems = batchItems.value.filter(
      (item) =>
        item.uiStatus === "ready" &&
        item.selectedStudent &&
        item.analysisResult?.extractedData,
    );

    if (readyItems.length === 0) {
      error.value = "Нет готовых файлов для импорта";
      toast.error("Выберите студентов для всех сертификатов");
      return;
    }

    isProcessing.value = true;
    error.value = null;

    try {
      const payload: BatchConfirmInput = {
        items: readyItems.map((item) => ({
          fileId: item.file.fileId,
          studentId: item.selectedStudent!.id,
          extractedData: item.analysisResult!.extractedData!,
        })),
      };

      const result = await authFetch<BatchConfirmResult>(
        "/api/ai-certificates/batch/confirm",
        {
          method: "POST",
          body: payload,
        },
      );

      result.results.forEach((confirmResult) => {
        const item = batchItems.value.find(
          (i) => i.file.fileId === confirmResult.fileId,
        );
        if (item) {
          if (confirmResult.success) {
            item.uiStatus = "confirmed";
          } else {
            item.uiStatus = "error";
          }
        }
      });

      if (result.errorCount > 0) {
        toast.warning(
          `Импортировано ${result.successCount} из ${readyItems.length} сертификатов`,
        );
      } else {
        toast.success(
          `Успешно импортировано ${result.successCount} сертификатов`,
        );
      }

      batchCurrentStep.value = 5;
      return result;
    } catch (e: any) {
      const msg =
        e.data?.message || e.message || "Ошибка подтверждения импорта";
      error.value = msg;
      toast.error(msg);
      throw e;
    } finally {
      isProcessing.value = false;
    }
  };

  // --- Computed Properties ---

  const batchProgress = computed(() => {
    if (batchStats.value.totalFiles === 0) return 0;
    return Math.round(
      (batchStats.value.readyFiles / batchStats.value.totalFiles) * 100,
    );
  });

  const canConfirmBatch = computed(() => {
    return batchStats.value.readyFiles > 0;
  });

  return {
    // Single Mode State
    currentStep,
    isProcessing,
    error,
    uploadedFile,
    analysisResult,
    editedData,
    selectedStudent,
    matchResult,
    importConfirmation,

    // Batch Mode State
    batchMode,
    batchItems,
    batchCurrentStep,
    batchStats,
    batchProgress,
    canConfirmBatch,

    // Single Mode Actions
    reset,
    uploadFile,
    analyzeFile,
    updateExtractedData,
    searchStudents,
    selectStudent,
    confirmImport,

    // Batch Mode Actions
    toggleBatchMode,
    resetBatch,
    uploadBatch,
    analyzeBatch,
    selectStudentForFile,
    updateBatchItemData,
    toggleItemExpanded,
    confirmBatchImport,

    // Data getters
    getStats,
    getLogs,
  };
};
