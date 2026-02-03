import { ref } from "vue";
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
} from "~/../server/types/aiCertificateImport";
import type { Student } from "~/../server/types/student";

export const useAICertificateImport = () => {
  const { authFetch } = useAuthFetch();
  const toast = useToast();

  // --- State ---
  const currentStep = ref(1);
  const isProcessing = ref(false);
  const error = ref<string | null>(null);

  // Improt Data State
  const uploadedFile = ref<UploadFileResult | null>(null);
  const analysisResult = ref<AIProcessingResult | null>(null);
  const editedData = ref<ExtractedCertificateData | null>(null);
  const selectedStudent = ref<Student | null>(null);
  const matchResult = ref<StudentMatchResult | null>(null);
  const importConfirmation = ref<ConfirmImportResult | null>(null);

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
      error.value = e.data?.message || e.message || "Ошибка загрузки файла";
      toast.error(error.value);
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
      error.value = e.data?.message || e.message || "Ошибка анализа файла";
      toast.error(error.value);
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
      error.value =
        e.data?.message || e.message || "Ошибка подтверждения импорта";
      toast.error(error.value);
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

  return {
    // State
    currentStep,
    isProcessing,
    error,
    uploadedFile,
    analysisResult,
    editedData,
    selectedStudent,
    matchResult,
    importConfirmation,

    // Actions
    reset,
    uploadFile,
    analyzeFile,
    updateExtractedData,
    searchStudents,
    selectStudent,
    confirmImport,

    // Data getters
    getStats,
    getLogs,
  };
};
