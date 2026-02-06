<template>
  <div class="tg-ai-upload-tab">
    <!-- Проверка доступа -->
    <div v-if="!canUpload" class="tg-no-permission">
      <div class="tg-icon-wrapper">
        <svg
          class="w-12 h-12"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          />
        </svg>
      </div>
      <h3>Нет доступа</h3>
      <p>У вас нет прав на загрузку сертификатов</p>
    </div>

    <div v-else>
      <!-- Успешный импорт -->
      <div v-if="importSuccess" class="tg-success-block">
        <div class="tg-success-icon">
          <svg
            class="w-16 h-16"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3>Сертификаты импортированы!</h3>
        <p>{{ successMessage }}</p>
        <button @click="resetAll" class="tg-btn-primary">
          Импортировать ещё
        </button>
      </div>

      <!-- Wizard шаги -->
      <div v-else>
        <!-- Прогресс бар -->
        <div class="tg-wizard-progress">
          <div
            v-for="s in 4"
            :key="s"
            class="tg-wizard-step"
            :class="{
              active: step === s,
              completed: step > s,
            }"
          >
            <span class="tg-step-number">{{ s }}</span>
            <span class="tg-step-label">{{ getStepLabel(s) }}</span>
          </div>
        </div>

        <!-- Шаг 1: Загрузка файлов -->
        <div v-if="step === 1" class="tg-step-content">
          <h2 class="tg-step-title">📤 Загрузка файлов</h2>
          <p class="tg-step-subtitle">
            Загрузите изображения сертификатов для распознавания
          </p>

          <!-- Drag & Drop зона -->
          <div
            class="tg-upload-zone"
            :class="{
              'tg-dragging': isDragging,
              'tg-has-files': files.length > 0,
            }"
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @click="triggerFileInput"
          >
            <div v-if="files.length === 0" class="tg-upload-placeholder">
              <svg
                class="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <p class="tg-upload-text">Нажмите для выбора файлов</p>
              <p class="tg-upload-hint">или перетащите сюда</p>
            </div>

            <div v-else class="tg-files-preview">
              <div
                v-for="(file, index) in files"
                :key="index"
                class="tg-file-item"
              >
                <img
                  v-if="file.preview"
                  :src="file.preview"
                  class="tg-file-thumb"
                  alt=""
                />
                <div v-else class="tg-file-icon">📄</div>
                <div class="tg-file-info">
                  <span class="tg-file-name">{{ file.name }}</span>
                  <span class="tg-file-size">{{ formatSize(file.size) }}</span>
                </div>
                <button
                  type="button"
                  class="tg-file-remove"
                  @click.stop="removeFile(index)"
                >
                  ✕
                </button>
              </div>
            </div>
          </div>

          <input
            ref="fileInputRef"
            type="file"
            accept="image/jpeg,image/png,application/pdf"
            multiple
            class="tg-hidden-input"
            @change="handleFileSelect"
          />

          <div class="tg-upload-info">
            <span class="tg-info-badge">📄 До 10 файлов</span>
            <span class="tg-info-badge">📏 До 10 МБ каждый</span>
            <span class="tg-info-badge">📋 JPG, PNG, PDF</span>
          </div>

          <div v-if="uploadError" class="tg-error-message">
            {{ uploadError }}
          </div>

          <button
            class="tg-btn-primary"
            :disabled="files.length === 0 || uploading"
            @click="uploadFiles"
          >
            <span v-if="uploading" class="tg-btn-spinner"></span>
            <template v-else>
              Загрузить и анализировать ({{ files.length }})
            </template>
          </button>
        </div>

        <!-- Шаг 2: AI Анализ -->
        <div v-if="step === 2" class="tg-step-content">
          <h2 class="tg-step-title">🤖 AI Анализ</h2>
          <p class="tg-step-subtitle">Распознавание данных с сертификатов</p>

          <div class="tg-analysis-progress">
            <div class="tg-progress-bar">
              <div
                class="tg-progress-fill"
                :style="{ width: analysisProgress + '%' }"
              ></div>
            </div>
            <p class="tg-progress-text">
              {{ analysisProgress }}% — Обработка...
            </p>
          </div>

          <div class="tg-analysis-items">
            <div
              v-for="item in analysisResults"
              :key="item.fileId"
              class="tg-analysis-item"
              :class="{
                'tg-item-success': item.success,
                'tg-item-error': !item.success,
                'tg-item-duplicate': item.extractedData?._isDuplicate,
              }"
            >
              <span class="tg-item-icon">
                {{
                  item.success
                    ? item.extractedData?._isDuplicate
                      ? "⚠️"
                      : "✅"
                    : "❌"
                }}
              </span>
              <span class="tg-item-name">{{ item.filename }}</span>
              <span
                v-if="item.extractedData?._isDuplicate"
                class="tg-item-badge tg-badge-warning"
              >
                Дубликат
              </span>
            </div>
          </div>
        </div>

        <!-- Шаг 3: Выбор студентов -->
        <div v-if="step === 3" class="tg-step-content">
          <h2 class="tg-step-title">👥 Проверка данных</h2>
          <p class="tg-step-subtitle">
            Проверьте распознанные данные и выберите слушателей
          </p>

          <div class="tg-results-list">
            <div
              v-for="(item, index) in validResults"
              :key="item.fileId"
              class="tg-result-card"
              :class="{ 'tg-card-expanded': expandedItems[item.fileId] }"
            >
              <!-- Заголовок карточки -->
              <div class="tg-card-header" @click="toggleExpand(item.fileId)">
                <div class="tg-card-info">
                  <h4>
                    {{ item.extractedData?.studentName || "Имя не распознано" }}
                  </h4>
                  <p class="tg-card-meta">
                    № {{ item.extractedData?.certificateNumber || "—" }}
                  </p>
                </div>
                <div class="tg-card-status">
                  <span
                    v-if="selectedStudents[item.fileId]"
                    class="tg-status-badge tg-status-ready"
                  >
                    ✓ Готов
                  </span>
                  <span v-else class="tg-status-badge tg-status-pending">
                    Выберите
                  </span>
                </div>
                <span
                  class="tg-card-arrow"
                  :class="{ 'tg-arrow-up': expandedItems[item.fileId] }"
                >
                  ▼
                </span>
              </div>

              <!-- Развёрнутое содержимое -->
              <transition name="tg-expand">
                <div v-if="expandedItems[item.fileId]" class="tg-card-body">
                  <!-- Распознанные данные -->
                  <div class="tg-extracted-data">
                    <div class="tg-data-row">
                      <span class="tg-data-label">Курс:</span>
                      <span class="tg-data-value">
                        {{ item.extractedData?.courseName || "Не распознано" }}
                      </span>
                    </div>
                    <div class="tg-data-row">
                      <span class="tg-data-label">Дата:</span>
                      <span class="tg-data-value">
                        {{ item.extractedData?.issueDate || "Не распознано" }}
                      </span>
                    </div>
                    <div
                      v-if="item.extractedData?.issuingOrganization"
                      class="tg-data-row"
                    >
                      <span class="tg-data-label">Центр:</span>
                      <span class="tg-data-value">
                        {{ item.extractedData.issuingOrganization }}
                      </span>
                    </div>
                  </div>

                  <!-- Выбор слушателя -->
                  <div class="tg-student-select">
                    <label class="tg-select-label">Выберите слушателя:</label>

                    <!-- Топ совпадения -->
                    <div
                      v-if="item.matchResult?.topAlternatives?.length"
                      class="tg-alternatives"
                    >
                      <div
                        v-for="(
                          alt, altIndex
                        ) in item.matchResult.topAlternatives.slice(0, 5)"
                        :key="alt.student.id"
                        class="tg-alternative-item"
                        :class="{
                          'tg-item-selected':
                            selectedStudents[item.fileId] === alt.student.id,
                        }"
                        @click="selectStudent(item.fileId, alt.student)"
                      >
                        <div class="tg-alt-radio">
                          <span
                            v-if="
                              selectedStudents[item.fileId] === alt.student.id
                            "
                            >●</span
                          >
                          <span v-else>○</span>
                        </div>
                        <div class="tg-alt-info">
                          <span class="tg-alt-name">{{
                            alt.student.fullName
                          }}</span>
                          <span class="tg-alt-position">{{
                            alt.student.position
                          }}</span>
                        </div>
                        <div class="tg-alt-score">
                          <span
                            class="tg-score-badge"
                            :class="getScoreClass(alt.matchScore)"
                          >
                            {{ Math.round(alt.matchScore) }}%
                          </span>
                          <span v-if="altIndex === 0" class="tg-best-match"
                            >🏆</span
                          >
                        </div>
                      </div>
                    </div>

                    <div v-else class="tg-no-matches">
                      <p>Совпадений не найдено</p>
                      <p class="tg-hint">
                        Проверьте, что слушатель добавлен в вашу организацию
                      </p>
                    </div>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <!-- Дубликаты -->
          <div v-if="duplicateResults.length > 0" class="tg-duplicates-section">
            <h4 class="tg-section-title">⚠️ Дубликаты (будут пропущены)</h4>
            <div class="tg-duplicate-list">
              <div
                v-for="dup in duplicateResults"
                :key="dup.fileId"
                class="tg-duplicate-item"
              >
                <span class="tg-dup-name">{{ dup.filename }}</span>
                <span class="tg-dup-reason">{{
                  dup.extractedData?._duplicateInfo
                }}</span>
              </div>
            </div>
          </div>

          <div class="tg-step-actions">
            <button class="tg-btn-secondary" @click="step = 1">← Назад</button>
            <button
              class="tg-btn-primary"
              :disabled="!canConfirm"
              @click="step = 4"
            >
              Подтвердить ({{ readyCount }})
            </button>
          </div>
        </div>

        <!-- Шаг 4: Подтверждение -->
        <div v-if="step === 4" class="tg-step-content">
          <h2 class="tg-step-title">✅ Подтверждение</h2>
          <p class="tg-step-subtitle">Проверьте и подтвердите импорт</p>

          <div class="tg-confirm-summary">
            <div class="tg-summary-card">
              <span class="tg-summary-value">{{ readyCount }}</span>
              <span class="tg-summary-label">К импорту</span>
            </div>
            <div class="tg-summary-card tg-card-warning">
              <span class="tg-summary-value">{{
                duplicateResults.length
              }}</span>
              <span class="tg-summary-label">Дубликатов</span>
            </div>
            <div class="tg-summary-card tg-card-error">
              <span class="tg-summary-value">{{ errorResults.length }}</span>
              <span class="tg-summary-label">Ошибок</span>
            </div>
          </div>

          <div v-if="confirmError" class="tg-error-message">
            {{ confirmError }}
          </div>

          <div class="tg-step-actions">
            <button class="tg-btn-secondary" @click="step = 3">← Назад</button>
            <button
              class="tg-btn-primary tg-btn-success"
              :disabled="confirming || readyCount === 0"
              @click="confirmImport"
            >
              <span v-if="confirming" class="tg-btn-spinner"></span>
              <template v-else>
                Импортировать {{ readyCount }} сертификатов
              </template>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  organizationId: {
    type: String,
    required: true,
  },
  permissions: {
    type: Object,
    required: true,
  },
  representative: {
    type: Object,
    default: null,
  },
});

// Проверка доступа
const canUpload = computed(() => {
  return (
    props.permissions?.can_request_certificates ||
    props.permissions?.can_upload_certificates
  );
});

// Состояния
const step = ref(1);
const files = ref([]);
const fileInputRef = ref(null);
const isDragging = ref(false);
const uploading = ref(false);
const uploadError = ref("");
const uploadedFileIds = ref([]);

const analysisProgress = ref(0);
const analysisResults = ref([]);
const analyzing = ref(false);

const expandedItems = ref({});
const selectedStudents = ref({});

const confirming = ref(false);
const confirmError = ref("");
const importSuccess = ref(false);
const successMessage = ref("");

// Computed
const validResults = computed(() => {
  return analysisResults.value.filter(
    (r) => r.success && !r.extractedData?._isDuplicate,
  );
});

const duplicateResults = computed(() => {
  return analysisResults.value.filter(
    (r) => r.success && r.extractedData?._isDuplicate,
  );
});

const errorResults = computed(() => {
  return analysisResults.value.filter((r) => !r.success);
});

const readyCount = computed(() => {
  return validResults.value.filter((r) => selectedStudents.value[r.fileId])
    .length;
});

const canConfirm = computed(() => {
  return readyCount.value > 0;
});

// Методы
function getStepLabel(s) {
  const labels = ["Загрузка", "Анализ", "Проверка", "Импорт"];
  return labels[s - 1] || "";
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + " Б";
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + " КБ";
  return (bytes / (1024 * 1024)).toFixed(1) + " МБ";
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(e) {
  const selectedFiles = Array.from(e.target.files || []);
  addFiles(selectedFiles);
  e.target.value = "";
}

function handleDrop(e) {
  isDragging.value = false;
  const droppedFiles = Array.from(e.dataTransfer?.files || []);
  addFiles(droppedFiles);
}

function addFiles(newFiles) {
  uploadError.value = "";

  // Проверка лимита
  if (files.value.length + newFiles.length > 10) {
    uploadError.value = "Максимум 10 файлов за раз";
    return;
  }

  for (const file of newFiles) {
    // Проверка типа
    const validTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      uploadError.value = `Неподдерживаемый формат: ${file.name}`;
      continue;
    }

    // Проверка размера (10 МБ)
    if (file.size > 10 * 1024 * 1024) {
      uploadError.value = `Файл слишком большой: ${file.name}`;
      continue;
    }

    // Создаём превью для изображений
    const fileData = {
      file,
      name: file.name,
      size: file.size,
      preview: null,
    };

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fileData.preview = e.target?.result;
      };
      reader.readAsDataURL(file);
    }

    files.value.push(fileData);
  }
}

function removeFile(index) {
  files.value.splice(index, 1);
}

async function uploadFiles() {
  if (files.value.length === 0) return;

  uploading.value = true;
  uploadError.value = "";

  try {
    const formData = new FormData();
    formData.append("organizationId", props.organizationId);
    formData.append("representativeId", props.representative?.id || "");

    for (const f of files.value) {
      formData.append("files", f.file);
    }

    const response = await $fetch("/api/tg-app/certificates/ai-batch/upload", {
      method: "POST",
      body: formData,
    });

    if (response.success) {
      uploadedFileIds.value = response.files
        .filter((f) => f.success)
        .map((f) => f.fileId);

      // Переходим к анализу
      step.value = 2;
      await runAnalysis();
    } else {
      uploadError.value = response.message || "Ошибка загрузки";
    }
  } catch (error) {
    console.error("Ошибка загрузки:", error);
    uploadError.value = error.data?.message || "Не удалось загрузить файлы";
  } finally {
    uploading.value = false;
  }
}

async function runAnalysis() {
  if (uploadedFileIds.value.length === 0) return;

  analyzing.value = true;
  analysisProgress.value = 10;

  try {
    // Имитация прогресса
    const progressInterval = setInterval(() => {
      if (analysisProgress.value < 90) {
        analysisProgress.value += Math.random() * 10;
      }
    }, 500);

    const response = await $fetch("/api/tg-app/certificates/ai-batch/analyze", {
      method: "POST",
      body: {
        fileIds: uploadedFileIds.value,
        organizationId: props.organizationId,
      },
    });

    clearInterval(progressInterval);
    analysisProgress.value = 100;

    if (response.success) {
      analysisResults.value = response.results;

      // Автоматически выбираем лучшего кандидата
      for (const result of response.results) {
        if (
          result.success &&
          !result.extractedData?._isDuplicate &&
          result.matchResult?.topAlternatives?.length > 0
        ) {
          const best = result.matchResult.topAlternatives[0];
          if (best.matchScore >= 70) {
            selectedStudents.value[result.fileId] = best.student.id;
          }
          // Раскрываем первый элемент
          if (Object.keys(expandedItems.value).length === 0) {
            expandedItems.value[result.fileId] = true;
          }
        }
      }

      // Переходим к шагу 3
      setTimeout(() => {
        step.value = 3;
      }, 500);
    }
  } catch (error) {
    console.error("Ошибка анализа:", error);
    uploadError.value = error.data?.message || "Ошибка AI-анализа";
    step.value = 1;
  } finally {
    analyzing.value = false;
  }
}

function toggleExpand(fileId) {
  expandedItems.value[fileId] = !expandedItems.value[fileId];
}

function selectStudent(fileId, student) {
  selectedStudents.value[fileId] = student.id;
}

function getScoreClass(score) {
  if (score >= 90) return "tg-score-excellent";
  if (score >= 70) return "tg-score-good";
  if (score >= 50) return "tg-score-medium";
  return "tg-score-low";
}

async function confirmImport() {
  confirming.value = true;
  confirmError.value = "";

  try {
    const items = validResults.value
      .filter((r) => selectedStudents.value[r.fileId])
      .map((r) => ({
        fileId: r.fileId,
        studentId: selectedStudents.value[r.fileId],
        extractedData: r.extractedData,
      }));

    const response = await $fetch("/api/tg-app/certificates/ai-batch/confirm", {
      method: "POST",
      body: {
        items,
        organizationId: props.organizationId,
        representativeId: props.representative?.id,
      },
    });

    if (response.success) {
      importSuccess.value = true;
      successMessage.value = response.message;

      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert(
          `Импортировано ${response.created} сертификатов`,
        );
      }
    } else {
      confirmError.value = response.message || "Ошибка импорта";
    }
  } catch (error) {
    console.error("Ошибка импорта:", error);
    confirmError.value = error.data?.message || "Не удалось импортировать";
  } finally {
    confirming.value = false;
  }
}

function resetAll() {
  step.value = 1;
  files.value = [];
  uploadedFileIds.value = [];
  analysisProgress.value = 0;
  analysisResults.value = [];
  expandedItems.value = {};
  selectedStudents.value = {};
  importSuccess.value = false;
  successMessage.value = "";
  uploadError.value = "";
  confirmError.value = "";
}
</script>

<style scoped>
.tg-ai-upload-tab {
  padding: 0;
}

/* Wizard Progress */
.tg-wizard-progress {
  display: flex;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding: 0.5rem;
  background: #f1f5f9;
  border-radius: 12px;
}

.tg-wizard-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  gap: 0.25rem;
}

.tg-step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.75rem;
  transition: all 0.2s;
}

.tg-wizard-step.active .tg-step-number {
  background: #2563eb;
  color: white;
}

.tg-wizard-step.completed .tg-step-number {
  background: #16a34a;
  color: white;
}

.tg-step-label {
  font-size: 0.625rem;
  color: #64748b;
  text-align: center;
}

.tg-wizard-step.active .tg-step-label {
  color: #2563eb;
  font-weight: 600;
}

/* Step Content */
.tg-step-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.tg-step-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.tg-step-subtitle {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0 0 1.25rem 0;
}

/* Upload Zone */
.tg-upload-zone {
  border: 2px dashed #cbd5e1;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 1rem;
  min-height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-upload-zone.tg-dragging {
  border-color: #2563eb;
  background: #eff6ff;
}

.tg-upload-zone.tg-has-files {
  padding: 0.75rem;
  min-height: auto;
}

.tg-upload-placeholder {
  color: #64748b;
}

.tg-upload-placeholder svg {
  margin: 0 auto 0.75rem;
  color: #94a3b8;
}

.tg-upload-text {
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.tg-upload-hint {
  font-size: 0.8125rem;
  color: #94a3b8;
  margin: 0;
}

/* Files Preview */
.tg-files-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  width: 100%;
}

.tg-file-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0.5rem;
  flex: 1 1 calc(50% - 0.25rem);
  min-width: 0;
}

.tg-file-thumb {
  width: 40px;
  height: 40px;
  object-fit: cover;
  border-radius: 6px;
  flex-shrink: 0;
}

.tg-file-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f1f5f9;
  border-radius: 6px;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.tg-file-info {
  flex: 1;
  min-width: 0;
}

.tg-file-name {
  display: block;
  font-size: 0.75rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-file-size {
  font-size: 0.625rem;
  color: #94a3b8;
}

.tg-file-remove {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #dc2626;
  cursor: pointer;
  font-size: 0.75rem;
  flex-shrink: 0;
}

.tg-hidden-input {
  display: none;
}

/* Upload Info */
.tg-upload-info {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
  margin-bottom: 1rem;
}

.tg-info-badge {
  font-size: 0.6875rem;
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

/* Error */
.tg-error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 0.75rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

/* Buttons */
.tg-btn-primary {
  width: 100%;
  padding: 0.875rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.tg-btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tg-btn-primary.tg-btn-success {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
}

.tg-btn-secondary {
  padding: 0.75rem 1.5rem;
  background: #f1f5f9;
  color: #475569;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.tg-btn-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Step Actions */
.tg-step-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.tg-step-actions .tg-btn-primary {
  flex: 1;
}

/* Analysis Progress */
.tg-analysis-progress {
  margin-bottom: 1.5rem;
}

.tg-progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.tg-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb 0%, #7c3aed 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.tg-progress-text {
  font-size: 0.8125rem;
  color: #64748b;
  text-align: center;
  margin: 0;
}

/* Analysis Items */
.tg-analysis-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tg-analysis-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f8fafc;
  border-radius: 8px;
}

.tg-item-icon {
  font-size: 1rem;
}

.tg-item-name {
  flex: 1;
  font-size: 0.875rem;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-item-badge {
  font-size: 0.625rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
}

.tg-badge-warning {
  background: #fef3c7;
  color: #d97706;
}

/* Results List */
.tg-results-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tg-result-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.tg-card-header {
  display: flex;
  align-items: center;
  padding: 0.875rem;
  cursor: pointer;
  gap: 0.5rem;
}

.tg-card-info {
  flex: 1;
  min-width: 0;
}

.tg-card-info h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.125rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-card-meta {
  font-size: 0.75rem;
  color: #64748b;
  margin: 0;
}

.tg-status-badge {
  font-size: 0.6875rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
}

.tg-status-ready {
  background: #dcfce7;
  color: #16a34a;
}

.tg-status-pending {
  background: #fef3c7;
  color: #d97706;
}

.tg-card-arrow {
  font-size: 0.75rem;
  color: #94a3b8;
  transition: transform 0.2s;
}

.tg-arrow-up {
  transform: rotate(180deg);
}

/* Card Body */
.tg-card-body {
  border-top: 1px solid #e2e8f0;
  padding: 0.875rem;
  background: #f8fafc;
}

.tg-extracted-data {
  margin-bottom: 1rem;
}

.tg-data-row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.8125rem;
}

.tg-data-label {
  color: #64748b;
}

.tg-data-value {
  color: #1e293b;
  font-weight: 500;
  text-align: right;
}

/* Student Select */
.tg-select-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.5rem;
}

.tg-alternatives {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tg-alternative-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-alternative-item.tg-item-selected {
  border-color: #2563eb;
  background: #eff6ff;
}

.tg-alt-radio {
  font-size: 1rem;
  color: #2563eb;
}

.tg-alt-info {
  flex: 1;
  min-width: 0;
}

.tg-alt-name {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #1e293b;
}

.tg-alt-position {
  font-size: 0.75rem;
  color: #64748b;
}

.tg-alt-score {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tg-score-badge {
  font-size: 0.6875rem;
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  font-weight: 600;
}

.tg-score-excellent {
  background: #dcfce7;
  color: #16a34a;
}

.tg-score-good {
  background: #dbeafe;
  color: #2563eb;
}

.tg-score-medium {
  background: #fef3c7;
  color: #d97706;
}

.tg-score-low {
  background: #fee2e2;
  color: #dc2626;
}

.tg-best-match {
  font-size: 0.875rem;
}

.tg-no-matches {
  text-align: center;
  padding: 1rem;
  color: #64748b;
}

.tg-hint {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

/* Duplicates */
.tg-duplicates-section {
  margin-top: 1rem;
}

.tg-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #d97706;
  margin: 0 0 0.5rem 0;
}

.tg-duplicate-list {
  background: #fef3c7;
  border-radius: 8px;
  padding: 0.5rem;
}

.tg-duplicate-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  font-size: 0.8125rem;
}

.tg-dup-name {
  font-weight: 500;
  color: #92400e;
}

.tg-dup-reason {
  font-size: 0.75rem;
  color: #a16207;
}

/* Confirm Summary */
.tg-confirm-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.tg-summary-card {
  background: #eff6ff;
  border-radius: 12px;
  padding: 1rem;
  text-align: center;
}

.tg-summary-card.tg-card-warning {
  background: #fef3c7;
}

.tg-summary-card.tg-card-error {
  background: #fee2e2;
}

.tg-summary-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
}

.tg-summary-label {
  font-size: 0.6875rem;
  color: #64748b;
}

/* Success Block */
.tg-success-block {
  text-align: center;
  padding: 3rem 1rem;
}

.tg-success-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto 1.5rem;
  background: #dcfce7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #16a34a;
}

.tg-success-block h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #16a34a;
}

.tg-success-block p {
  color: #64748b;
  margin-bottom: 1.5rem;
}

/* No Permission */
.tg-no-permission {
  text-align: center;
  padding: 3rem 1rem;
}

.tg-icon-wrapper {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background: #f1f5f9;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
}

.tg-no-permission h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.tg-no-permission p {
  color: #64748b;
  font-size: 0.9375rem;
}

/* Expand Animation */
.tg-expand-enter-active,
.tg-expand-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.tg-expand-enter-from,
.tg-expand-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
</style>
