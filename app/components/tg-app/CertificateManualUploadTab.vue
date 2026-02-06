<template>
  <div class="tg-upload-tab">
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
      <!-- Успешная загрузка -->
      <div v-if="uploadSuccess" class="tg-success-block">
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
        <h3>Сертификат загружен!</h3>
        <p>{{ successMessage }}</p>
        <button @click="resetForm" class="tg-btn-primary">Загрузить ещё</button>
      </div>

      <!-- Форма загрузки -->
      <form v-else @submit.prevent="submitForm" class="tg-upload-form">
        <h2 class="tg-form-title">📜 Загрузка сертификата</h2>
        <p class="tg-form-subtitle">
          Добавьте сертификат для слушателя вашей организации
        </p>

        <!-- Выбор слушателя -->
        <div class="tg-form-group">
          <label class="tg-label">Слушатель *</label>
          <div class="tg-autocomplete">
            <div class="tg-search-input-wrapper">
              <input
                v-model="studentSearch"
                type="text"
                placeholder="Введите имя слушателя..."
                class="tg-input"
                :class="{ 'tg-input-error': errors.studentId }"
                @input="onStudentSearch"
                @focus="showStudentDropdown = true"
              />
              <div v-if="searchingStudents" class="tg-input-spinner"></div>
            </div>

            <!-- Dropdown результатов -->
            <div
              v-if="showStudentDropdown && studentResults.length > 0"
              class="tg-dropdown"
            >
              <div
                v-for="student in studentResults"
                :key="student.id"
                class="tg-dropdown-item"
                @click="selectStudent(student)"
              >
                <div class="tg-dropdown-avatar">
                  {{ getInitials(student.fullName) }}
                </div>
                <div class="tg-dropdown-info">
                  <span class="tg-dropdown-name">{{ student.fullName }}</span>
                  <span class="tg-dropdown-meta">{{ student.position }}</span>
                </div>
                <span
                  v-if="student.certificatesCount > 0"
                  class="tg-dropdown-badge"
                >
                  📜 {{ student.certificatesCount }}
                </span>
              </div>
            </div>

            <!-- Выбранный слушатель -->
            <div v-if="selectedStudent" class="tg-selected-student">
              <div class="tg-selected-avatar">
                {{ getInitials(selectedStudent.fullName) }}
              </div>
              <div class="tg-selected-info">
                <span class="tg-selected-name">{{
                  selectedStudent.fullName
                }}</span>
                <span class="tg-selected-meta">{{
                  selectedStudent.position
                }}</span>
              </div>
              <button type="button" class="tg-btn-clear" @click="clearStudent">
                <svg
                  class="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <span v-if="errors.studentId" class="tg-error-text">{{
            errors.studentId
          }}</span>
        </div>

        <!-- Номер сертификата -->
        <div class="tg-form-group">
          <label class="tg-label">Номер сертификата *</label>
          <input
            v-model="form.certificateNumber"
            type="text"
            placeholder="Например: ATC25_001"
            class="tg-input"
            :class="{ 'tg-input-error': errors.certificateNumber }"
          />
          <span v-if="errors.certificateNumber" class="tg-error-text">{{
            errors.certificateNumber
          }}</span>
        </div>

        <!-- Название курса -->
        <div class="tg-form-group">
          <label class="tg-label">Название курса *</label>
          <input
            v-model="form.courseName"
            type="text"
            placeholder="Например: Авиационная безопасность"
            class="tg-input"
            :class="{ 'tg-input-error': errors.courseName }"
          />
          <span v-if="errors.courseName" class="tg-error-text">{{
            errors.courseName
          }}</span>
        </div>

        <!-- Даты -->
        <div class="tg-form-row">
          <div class="tg-form-group tg-form-half">
            <label class="tg-label">Дата выдачи *</label>
            <input
              v-model="form.issueDate"
              type="date"
              class="tg-input"
              :class="{ 'tg-input-error': errors.issueDate }"
            />
            <span v-if="errors.issueDate" class="tg-error-text">{{
              errors.issueDate
            }}</span>
          </div>
          <div class="tg-form-group tg-form-half">
            <label class="tg-label">Срок действия</label>
            <input v-model="form.expiryDate" type="date" class="tg-input" />
          </div>
        </div>

        <!-- Дополнительные поля (сворачиваемые) -->
        <div class="tg-collapsible">
          <button
            type="button"
            class="tg-collapsible-header"
            @click="showExtra = !showExtra"
          >
            <span>Дополнительные данные</span>
            <svg
              class="w-4 h-4"
              :class="{ 'tg-rotated': showExtra }"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          <transition name="tg-slide">
            <div v-if="showExtra" class="tg-collapsible-content">
              <div class="tg-form-group">
                <label class="tg-label">Учебный центр</label>
                <input
                  v-model="form.issuingOrganization"
                  type="text"
                  placeholder="Организация, выдавшая сертификат"
                  class="tg-input"
                />
              </div>
              <div class="tg-form-group">
                <label class="tg-label">Количество часов</label>
                <input
                  v-model="form.courseHours"
                  type="number"
                  placeholder="72"
                  min="1"
                  class="tg-input"
                />
              </div>
              <div class="tg-form-group">
                <label class="tg-label">Примечания</label>
                <textarea
                  v-model="form.notes"
                  placeholder="Дополнительная информация..."
                  rows="2"
                  class="tg-input tg-textarea"
                ></textarea>
              </div>
            </div>
          </transition>
        </div>

        <!-- Ошибка отправки -->
        <div v-if="submitError" class="tg-submit-error">
          <svg
            class="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{{ submitError }}</span>
        </div>

        <!-- Кнопка отправки -->
        <button type="submit" class="tg-btn-submit" :disabled="submitting">
          <div v-if="submitting" class="tg-btn-spinner"></div>
          <template v-else>
            <svg
              class="w-5 h-5"
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
            Загрузить сертификат
          </template>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

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
  // Используем can_request_certificates или можно добавить новое разрешение can_upload_certificates
  return (
    props.permissions?.can_request_certificates ||
    props.permissions?.can_upload_certificates
  );
});

// Состояние формы
const form = ref({
  certificateNumber: "",
  courseName: "",
  issueDate: "",
  expiryDate: "",
  issuingOrganization: "",
  courseHours: "",
  notes: "",
});

const errors = ref({});
const submitting = ref(false);
const submitError = ref("");
const uploadSuccess = ref(false);
const successMessage = ref("");
const showExtra = ref(false);

// Поиск слушателей
const studentSearch = ref("");
const studentResults = ref([]);
const selectedStudent = ref(null);
const searchingStudents = ref(false);
const showStudentDropdown = ref(false);
let searchTimeout = null;

// Debounced поиск слушателей
function onStudentSearch() {
  if (selectedStudent.value) {
    selectedStudent.value = null;
  }

  clearTimeout(searchTimeout);

  if (studentSearch.value.length < 2) {
    studentResults.value = [];
    return;
  }

  searchTimeout = setTimeout(async () => {
    await searchStudents();
  }, 300);
}

async function searchStudents() {
  if (studentSearch.value.length < 2) return;

  searchingStudents.value = true;

  try {
    const response = await $fetch("/api/tg-app/students/search", {
      params: {
        organizationId: props.organizationId,
        q: studentSearch.value,
        limit: 5,
      },
    });

    studentResults.value = response.students || [];
    showStudentDropdown.value = true;
  } catch (err) {
    console.error("Ошибка поиска слушателей:", err);
    studentResults.value = [];
  } finally {
    searchingStudents.value = false;
  }
}

function selectStudent(student) {
  selectedStudent.value = student;
  studentSearch.value = "";
  studentResults.value = [];
  showStudentDropdown.value = false;
  errors.value.studentId = "";
}

function clearStudent() {
  selectedStudent.value = null;
  studentSearch.value = "";
}

function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return fullName[0];
}

// Валидация формы
function validateForm() {
  errors.value = {};

  if (!selectedStudent.value) {
    errors.value.studentId = "Выберите слушателя";
  }

  if (
    !form.value.certificateNumber ||
    form.value.certificateNumber.trim().length < 3
  ) {
    errors.value.certificateNumber = "Минимум 3 символа";
  }

  if (!form.value.courseName || form.value.courseName.trim().length < 3) {
    errors.value.courseName = "Минимум 3 символа";
  }

  if (!form.value.issueDate) {
    errors.value.issueDate = "Укажите дату";
  }

  return Object.keys(errors.value).length === 0;
}

// Отправка формы
async function submitForm() {
  if (!validateForm()) return;

  submitting.value = true;
  submitError.value = "";

  try {
    const response = await $fetch("/api/tg-app/certificates/manual", {
      method: "POST",
      body: {
        organizationId: props.organizationId,
        representativeId: props.representative?.id,
        studentId: selectedStudent.value.id,
        certificateNumber: form.value.certificateNumber,
        courseName: form.value.courseName,
        issueDate: form.value.issueDate,
        expiryDate: form.value.expiryDate || null,
        issuingOrganization: form.value.issuingOrganization || null,
        courseHours: form.value.courseHours
          ? Number(form.value.courseHours)
          : null,
        notes: form.value.notes || null,
      },
    });

    if (response.success) {
      uploadSuccess.value = true;
      successMessage.value = `Сертификат "${response.certificate.certificateNumber}" добавлен для ${selectedStudent.value.fullName}`;

      // Уведомление в Telegram
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Сертификат успешно загружен!");
      }
    }
  } catch (err) {
    console.error("Ошибка загрузки сертификата:", err);
    submitError.value = err.data?.message || "Не удалось загрузить сертификат";
  } finally {
    submitting.value = false;
  }
}

// Сброс формы
function resetForm() {
  form.value = {
    certificateNumber: "",
    courseName: "",
    issueDate: "",
    expiryDate: "",
    issuingOrganization: "",
    courseHours: "",
    notes: "",
  };
  errors.value = {};
  selectedStudent.value = null;
  studentSearch.value = "";
  uploadSuccess.value = false;
  successMessage.value = "";
  submitError.value = "";
  showExtra.value = false;
}

// Закрываем dropdown при клике вне
if (typeof window !== "undefined") {
  document.addEventListener("click", (e) => {
    const autocomplete = document.querySelector(".tg-autocomplete");
    if (autocomplete && !autocomplete.contains(e.target)) {
      showStudentDropdown.value = false;
    }
  });
}
</script>

<style scoped>
.tg-upload-tab {
  padding: 0;
}

/* Нет доступа */
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

/* Успешная загрузка */
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
  line-height: 1.5;
}

/* Форма */
.tg-upload-form {
  background: white;
  border-radius: 16px;
  padding: 1.25rem;
  border: 1px solid #e2e8f0;
}

.tg-form-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 0.25rem 0;
}

.tg-form-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0 0 1.5rem 0;
}

.tg-form-group {
  margin-bottom: 1rem;
}

.tg-form-row {
  display: flex;
  gap: 0.75rem;
}

.tg-form-half {
  flex: 1;
}

.tg-label {
  display: block;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #475569;
  margin-bottom: 0.375rem;
}

.tg-input {
  width: 100%;
  padding: 0.75rem 1rem;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  font-size: 0.9375rem;
  color: #1e293b;
  transition: all 0.2s;
}

.tg-input:focus {
  outline: none;
  border-color: #2563eb;
  background: white;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tg-input::placeholder {
  color: #94a3b8;
}

.tg-input-error {
  border-color: #dc2626;
  background: #fef2f2;
}

.tg-textarea {
  resize: none;
  min-height: 60px;
}

.tg-error-text {
  display: block;
  font-size: 0.75rem;
  color: #dc2626;
  margin-top: 0.25rem;
}

/* Autocomplete */
.tg-autocomplete {
  position: relative;
}

.tg-search-input-wrapper {
  position: relative;
}

.tg-input-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  border: 2px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to {
    transform: translateY(-50%) rotate(360deg);
  }
}

.tg-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  margin-top: 4px;
  max-height: 250px;
  overflow-y: auto;
}

.tg-dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background 0.15s;
}

.tg-dropdown-item:hover,
.tg-dropdown-item:active {
  background: #f8fafc;
}

.tg-dropdown-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.tg-dropdown-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8125rem;
  color: white;
  flex-shrink: 0;
}

.tg-dropdown-info {
  flex: 1;
  min-width: 0;
}

.tg-dropdown-name {
  display: block;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-dropdown-meta {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.tg-dropdown-badge {
  font-size: 0.75rem;
  background: #eff6ff;
  color: #2563eb;
  padding: 0.125rem 0.5rem;
  border-radius: 6px;
  flex-shrink: 0;
}

/* Выбранный слушатель */
.tg-selected-student {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  margin-top: 0.5rem;
}

.tg-selected-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  flex-shrink: 0;
}

.tg-selected-info {
  flex: 1;
  min-width: 0;
}

.tg-selected-name {
  display: block;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
}

.tg-selected-meta {
  display: block;
  font-size: 0.75rem;
  color: #64748b;
}

.tg-btn-clear {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
  cursor: pointer;
  flex-shrink: 0;
}

.tg-btn-clear:active {
  background: #bfdbfe;
}

/* Collapsible */
.tg-collapsible {
  margin: 1rem 0;
}

.tg-collapsible-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 0.75rem 0;
  background: none;
  border: none;
  border-top: 1px solid #e2e8f0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
}

.tg-collapsible-header svg {
  transition: transform 0.2s;
}

.tg-collapsible-header svg.tg-rotated {
  transform: rotate(180deg);
}

.tg-collapsible-content {
  padding-top: 0.5rem;
}

/* Submit error */
.tg-submit-error {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #fef2f2;
  border: 1px solid #fca5a5;
  border-radius: 10px;
  color: #dc2626;
  font-size: 0.875rem;
  margin-bottom: 1rem;
}

/* Submit button */
.tg-btn-submit {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn-submit:not(:disabled):active {
  transform: scale(0.98);
}

.tg-btn-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

.tg-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #2563eb;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-primary:active {
  transform: scale(0.98);
}

/* Animations */
.tg-slide-enter-active,
.tg-slide-leave-active {
  transition: all 0.25s ease;
  max-height: 300px;
  overflow: hidden;
}

.tg-slide-enter-from,
.tg-slide-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
