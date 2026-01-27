<template>
  <div class="tg-registration-form">
    <form @submit.prevent="handleSubmit">
      <!-- Шаг 1: ФИО -->
      <div v-if="step === 1" class="tg-form-step">
        <div class="tg-step-indicator">
          <div class="tg-step-progress">
            <div class="tg-step-dot active">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div class="tg-step-line"></div>
            <div class="tg-step-dot">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div class="tg-step-line"></div>
            <div class="tg-step-dot">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <span class="tg-step-text">Шаг 1 из 3</span>
        </div>

        <div class="tg-form-header">
          <h2>Введите ваше ФИО</h2>
          <p>Укажите полные данные</p>
        </div>

        <div class="tg-form-group">
          <input
            v-model="formData.fullName"
            type="text"
            placeholder="Фамилия Имя Отчество"
            class="tg-input"
            :class="{ error: errors.fullName }"
            autocomplete="name"
          />
          <p v-if="errors.fullName" class="tg-error-text">
            {{ errors.fullName }}
          </p>
        </div>

        <button type="button" @click="nextStep" class="tg-btn-next">
          <span>Продолжить</span>
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
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      <!-- Шаг 2: Телефон -->
      <div v-if="step === 2" class="tg-form-step">
        <div class="tg-step-indicator">
          <div class="tg-step-progress">
            <div class="tg-step-dot completed">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div class="tg-step-line filled"></div>
            <div class="tg-step-dot active">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div class="tg-step-line"></div>
            <div class="tg-step-dot">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <span class="tg-step-text">Шаг 2 из 3</span>
        </div>

        <div class="tg-form-header">
          <h2>Номер телефона</h2>
          <p>Введите номер в формате Узбекистана</p>
        </div>

        <div class="tg-form-group">
          <div class="tg-phone-input-wrapper">
            <span class="tg-phone-prefix">+998</span>
            <input
              ref="phoneInput"
              v-model="phoneNumber"
              type="tel"
              placeholder="XX XXX XX XX"
              class="tg-input tg-phone-input"
              :class="{ error: errors.phone }"
              autocomplete="tel"
              maxlength="12"
              @input="formatPhoneNumber"
              @keydown="handlePhoneKeydown"
            />
          </div>
          <p v-if="errors.phone" class="tg-error-text">{{ errors.phone }}</p>
        </div>

        <div class="tg-form-actions">
          <button type="button" @click="prevStep" class="tg-btn-back">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Назад</span>
          </button>
          <button type="button" @click="nextStep" class="tg-btn-next">
            <span>Продолжить</span>
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
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Шаг 3: Организация -->
      <div v-if="step === 3" class="tg-form-step">
        <div class="tg-step-indicator">
          <div class="tg-step-progress">
            <div class="tg-step-dot completed">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div class="tg-step-line filled"></div>
            <div class="tg-step-dot completed">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div class="tg-step-line filled"></div>
            <div class="tg-step-dot active">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
          </div>
          <span class="tg-step-text">Шаг 3 из 3</span>
        </div>

        <div class="tg-form-header">
          <h2>Организация</h2>
          <p>Выберите или введите название</p>
        </div>

        <div class="tg-form-group">
          <!-- Организация с автодополнением -->
          <div class="tg-autocomplete">
            <input
              v-model="formData.organizationName"
              type="text"
              placeholder="Название организации"
              class="tg-input"
              :class="{ error: errors.organizationName }"
              @input="handleOrgInput"
              @focus="showSuggestions = true"
              autocomplete="off"
            />

            <!-- Список подсказок -->
            <div
              v-if="showSuggestions && filteredOrganizations.length > 0"
              class="tg-organizations-dropdown"
            >
              <button
                v-for="org in filteredOrganizations"
                :key="org.id"
                type="button"
                @click="selectOrganization(org)"
                class="tg-org-item"
              >
                <svg
                  class="w-4 h-4 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span class="tg-org-name">{{ org.name }}</span>
                <svg
                  class="w-4 h-4 tg-org-check"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fill-rule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clip-rule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>

          <p v-if="errors.organizationName" class="tg-error-text">
            {{ errors.organizationName }}
          </p>
        </div>

        <div class="tg-form-actions">
          <button type="button" @click="prevStep" class="tg-btn-back">
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
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span>Назад</span>
          </button>
          <button type="submit" :disabled="submitting" class="tg-btn-submit">
            <span v-if="!submitting" class="flex items-center gap-2">
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              Отправить
            </span>
            <span v-else class="tg-btn-loading">
              <span class="tg-spinner-small"></span>
              Отправка...
            </span>
          </button>
        </div>
      </div>

      <!-- Общие ошибки -->
      <div v-if="generalError" class="tg-general-error">
        <svg
          class="w-5 h-5 text-red-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <p>{{ generalError }}</p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";

const props = defineProps({
  telegramData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["registered"]);

// Состояние формы
const step = ref(1);
const phoneInput = ref(null);
const phoneNumber = ref("");
const formData = ref({
  fullName: "",
  phone: "",
  organizationName: "",
  organizationId: null,
});
const errors = ref({
  fullName: "",
  phone: "",
  organizationName: "",
});
const generalError = ref("");
const submitting = ref(false);

// Организации
const organizations = ref([]);
const showSuggestions = ref(false);
const selectedOrg = ref(null);
const loadingOrgs = ref(false);

// Фильтрованный список организаций
const filteredOrganizations = computed(() => {
  if (!formData.value.organizationName) return [];

  const query = formData.value.organizationName.toLowerCase();
  return organizations.value
    .filter((org) => org.name.toLowerCase().includes(query))
    .slice(0, 10);
});

// Форматирование телефона
function formatPhoneNumber(event) {
  let value = event.target.value.replace(/\D/g, "");

  // Ограничиваем до 9 цифр
  if (value.length > 9) {
    value = value.substring(0, 9);
  }

  // Форматируем: XX XXX XX XX
  let formatted = "";
  if (value.length > 0) {
    formatted = value.substring(0, 2);
  }
  if (value.length > 2) {
    formatted += " " + value.substring(2, 5);
  }
  if (value.length > 5) {
    formatted += " " + value.substring(5, 7);
  }
  if (value.length > 7) {
    formatted += " " + value.substring(7, 9);
  }

  phoneNumber.value = formatted;
}

function handlePhoneKeydown(event) {
  // Разрешаем: backspace, delete, tab, escape, enter, стрелки
  if ([8, 9, 27, 13, 46, 37, 38, 39, 40].includes(event.keyCode)) {
    return;
  }
  // Разрешаем только цифры
  if (
    (event.keyCode < 48 || event.keyCode > 57) &&
    (event.keyCode < 96 || event.keyCode > 105)
  ) {
    event.preventDefault();
  }
}

// Валидация ФИО
function validateFullName(name) {
  const trimmed = name.trim();
  if (!trimmed) return "ФИО обязательно для заполнения";
  if (trimmed.length < 3) return "ФИО должно содержать минимум 3 символа";
  if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/u.test(trimmed))
    return "ФИО может содержать только буквы, пробелы и дефисы";
  return "";
}

// Валидация телефона
function validatePhone() {
  const cleaned = phoneNumber.value.replace(/\D/g, "");
  if (!cleaned) return "Номер телефона обязателен";
  if (cleaned.length !== 9) return "Введите полный номер (9 цифр)";
  return "";
}

// Валидация организации
function validateOrganization() {
  if (!formData.value.organizationName.trim()) {
    return "Введите название организации";
  }
  return "";
}

// Следующий шаг
function nextStep() {
  // Очистка ошибок
  errors.value = { fullName: "", phone: "", organizationName: "" };
  generalError.value = "";

  // Валидация текущего шага
  if (step.value === 1) {
    const error = validateFullName(formData.value.fullName);
    if (error) {
      errors.value.fullName = error;
      return;
    }
  } else if (step.value === 2) {
    const error = validatePhone();
    if (error) {
      errors.value.phone = error;
      return;
    }

    // Формируем полный номер
    const cleaned = phoneNumber.value.replace(/\D/g, "");
    formData.value.phone = "+998" + cleaned;

    // Загрузка списка организаций
    loadOrganizations();
  }

  step.value++;
}

// Предыдущий шаг
function prevStep() {
  step.value--;
  errors.value = { fullName: "", phone: "", organizationName: "" };
  generalError.value = "";
}

// Загрузка организаций
async function loadOrganizations() {
  if (organizations.value.length > 0) return; // Уже загружены

  loadingOrgs.value = true;
  try {
    const data = await $fetch("/api/tg-app/organizations", {
      query: { limit: 1000 },
    });
    organizations.value = data.data || [];
  } catch (error) {
    console.error("Ошибка загрузки организаций:", error);
    generalError.value = "Не удалось загрузить список организаций";
  } finally {
    loadingOrgs.value = false;
  }
}

// Ввод названия организации
function handleOrgInput() {
  selectedOrg.value = null;
  formData.value.organizationId = null;
  showSuggestions.value = true;
}

// Выбор организации
function selectOrganization(org) {
  selectedOrg.value = org;
  formData.value.organizationId = org.id;
  formData.value.organizationName = org.name;
  showSuggestions.value = false;
}

// Отправка формы
async function handleSubmit() {
  // Валидация последнего шага
  const orgError = validateOrganization();
  if (orgError) {
    errors.value.organizationName = orgError;
    return;
  }

  submitting.value = true;
  generalError.value = "";

  try {
    const response = await $fetch("/api/tg-app/register", {
      method: "POST",
      body: {
        initData: props.telegramData.initData,
        fullName: formData.value.fullName.trim(),
        phone: formData.value.phone,
        organizationId: formData.value.organizationId,
        organizationName: formData.value.organizationName.trim(),
        username: props.telegramData.user?.username || null,
      },
    });

    // Успех!
    emit("registered", response);
  } catch (error) {
    console.error("Ошибка регистрации:", error);
    generalError.value =
      error.data?.message ||
      "Произошла ошибка при регистрации. Попробуйте позже.";
  } finally {
    submitting.value = false;
  }
}

// Автозаполнение из Telegram данных
watch(
  () => props.telegramData,
  (data) => {
    if (data?.user) {
      // Пытаемся автозаполнить ФИО из Telegram
      const firstName = data.user.first_name || "";
      const lastName = data.user.last_name || "";
      if (firstName && !formData.value.fullName) {
        formData.value.fullName = `${lastName} ${firstName}`.trim();
      }
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.tg-registration-form {
  max-width: 400px;
  margin: 0 auto;
  padding: 0 0.5rem;
}

/* Шаг формы */
.tg-form-step {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 1.25rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
  animation: tg-fade-in 0.3s ease;
}

@keyframes tg-fade-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Индикатор шага */
.tg-step-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tg-step-progress {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 0.5rem;
}

.tg-step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #f1f5f9;
  border: 2px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  color: #94a3b8;
}

.tg-step-dot.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
  transform: scale(1.1);
}

.tg-step-dot.completed {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.tg-step-line {
  width: 40px;
  height: 2px;
  background: #e2e8f0;
  transition: all 0.3s ease;
}

.tg-step-line.filled {
  background: #10b981;
}

.tg-step-text {
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Заголовок формы */
.tg-form-header {
  text-align: center;
  margin-bottom: 1.5rem;
}

.tg-form-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 1rem;
  background: #eff6ff;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2563eb;
}

.tg-form-header h2 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
  color: #1e293b;
}

.tg-form-header p {
  color: #64748b;
  font-size: 0.875rem;
  line-height: 1.4;
}

/* Группа формы */
.tg-form-group {
  margin-bottom: 1.5rem;
}

/* Инпуты */
.tg-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 1rem;
  transition: all 0.2s;
}

.tg-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tg-input.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.tg-input::placeholder {
  color: #94a3b8;
}

/* Телефонный инпут с пресетом */
.tg-phone-input-wrapper {
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.tg-phone-input-wrapper:focus-within {
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tg-phone-prefix {
  padding: 0.875rem 1rem;
  background: #f8fafc;
  color: #1e293b;
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
  border-right: 1px solid #e2e8f0;
}

.tg-phone-input {
  border: none !important;
  border-radius: 0 !important;
  padding-left: 1rem;
  flex: 1;
  font-family: ui-monospace, monospace;
  letter-spacing: 0.5px;
}

.tg-phone-input:focus {
  box-shadow: none !important;
}

/* Текст ошибки */
.tg-error-text {
  color: #ef4444;
  font-size: 0.8125rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.tg-error-text::before {
  content: "";
  width: 4px;
  height: 4px;
  background: #ef4444;
  border-radius: 50%;
}

/* Общая ошибка */
.tg-general-error {
  background: #fef2f2;
  border: 1px solid #fee2e2;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-general-error p {
  margin: 0;
  color: #dc2626;
  font-size: 0.875rem;
}

/* Автозаполнение */
.tg-autocomplete {
  position: relative;
}

.tg-organizations-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-top: 0.5rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 10;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tg-org-item {
  width: 100%;
  padding: 0.75rem 1rem;
  text-align: left;
  background: transparent;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  transition: all 0.2s;
  color: #1e293b;
}

.tg-org-item:last-child {
  border-bottom: none;
}

.tg-org-item:hover,
.tg-org-item:focus {
  background: #f8fafc;
}

.tg-org-name {
  flex: 1;
  font-size: 0.9375rem;
}

.tg-org-check {
  color: #2563eb;
  opacity: 0;
  transition: opacity 0.2s;
}

.tg-org-item:hover .tg-org-check {
  opacity: 1;
}

/* Кнопки действий */
.tg-form-actions {
  display: flex;
  gap: 0.75rem;
}

.tg-btn-back,
.tg-btn-next,
.tg-btn-submit {
  flex: 1;
  padding: 0.875rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 0.9375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.tg-btn-back {
  background: white;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.tg-btn-back:active {
  background: #f8fafc;
}

.tg-btn-next,
.tg-btn-submit {
  background: #2563eb;
  color: white;
  box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);
}

.tg-btn-next:active,
.tg-btn-submit:active {
  background: #1d4ed8;
  transform: translateY(1px);
}

.tg-btn-next:disabled,
.tg-btn-submit:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tg-btn-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tg-spinner-small {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: tg-spin 0.6s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
