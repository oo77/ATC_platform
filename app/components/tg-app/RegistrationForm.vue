<template>
  <div class="tg-registration-form">
    <form @submit.prevent="handleSubmit">
      <!-- Шаг 1: ФИО -->
      <div v-if="step === 1" class="tg-form-step">
        <div class="tg-step-indicator">
          <span class="tg-step-number">1</span>
          <span class="tg-step-total">/ 3</span>
        </div>
        
        <h2>Введите ваше ФИО</h2>
        <p>Пожалуйста, укажите полное ФИО (Фамилия Имя Отчество)</p>

        <div class="tg-form-group">
          <input
            v-model="formData.fullName"
            type="text"
            placeholder="Иванов Иван Иванович"
            class="tg-input"
            :class="{ error: errors.fullName }"
            autocomplete="name"
          />
          <p v-if="errors.fullName" class="tg-error-text">{{ errors.fullName }}</p>
        </div>

        <button type="button" @click="nextStep" class="tg-btn-next">
          Далее →
        </button>
      </div>

      <!-- Шаг 2: Телефон -->
      <div v-if="step === 2" class="tg-form-step">
        <div class="tg-step-indicator">
          <span class="tg-step-number">2</span>
          <span class="tg-step-total">/ 3</span>
        </div>
        
        <h2>Ваш номер телефона</h2>
        <p>Введите номер в формате: +998XXXXXXXXX</p>

        <div class="tg-form-group">
          <input
            v-model="formData.phone"
            type="tel"
            placeholder="+998901234567"
            class="tg-input"
            :class="{ error: errors.phone }"
            autocomplete="tel"
          />
          <p v-if="errors.phone" class="tg-error-text">{{ errors.phone }}</p>
        </div>

        <div class="tg-form-actions">
          <button type="button" @click="prevStep" class="tg-btn-back">
            ← Назад
          </button>
          <button type="button" @click="nextStep" class="tg-btn-next">
            Далее →
          </button>
        </div>
      </div>

      <!-- Шаг 3: Организация -->
      <div v-if="step === 3" class="tg-form-step">
        <div class="tg-step-indicator">
          <span class="tg-step-number">3</span>
          <span class="tg-step-total">/ 3</span>
        </div>
        
        <h2>Выбор организации</h2>
        <p>Выберите вашу организацию из списка или введите название</p>

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
                  <span class="tg-org-name">{{ org.name }}</span>
                  <span class="tg-org-check">✓</span>
                </button>
              </div>
          </div>

          <p v-if="errors.organizationName" class="tg-error-text">{{ errors.organizationName }}</p>
        </div>

        <div class="tg-form-actions">
          <button type="button" @click="prevStep" class="tg-btn-back">
            ← Назад
          </button>
          <button 
            type="submit" 
            :disabled="submitting"
            class="tg-btn-submit"
          >
            <span v-if="!submitting">Зарегистрироваться</span>
            <span v-else class="tg-btn-loading">
              <span class="tg-spinner-small"></span>
              Отправка...
            </span>
          </button>
        </div>
      </div>

      <!-- Общие ошибки -->
      <div v-if="generalError" class="tg-general-error">
        <span class="tg-error-icon">⚠️</span>
        <p>{{ generalError }}</p>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const props = defineProps({
  telegramData: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['registered']);

// Состояние формы
const step = ref(1);
const formData = ref({
  fullName: '',
  phone: '',
  organizationName: '',
  organizationId: null,
});
const errors = ref({
  fullName: '',
  phone: '',
  organizationName: '',
});
const generalError = ref('');
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
    .filter(org => org.name.toLowerCase().includes(query))
    .slice(0, 10);
});

// Валидация ФИО
function validateFullName(name) {
  const trimmed = name.trim();
  if (!trimmed) return 'ФИО обязательно для заполнения';
  if (trimmed.length < 3) return 'ФИО должно содержать минимум 3 символа';
  if (!/^[а-яёА-ЯЁa-zA-Z\s\-]+$/u.test(trimmed)) return 'ФИО может содержать только буквы, пробелы и дефисы';
  return '';
}

// Валидация телефона
function validatePhone(phone) {
  const cleaned = phone.replace(/[^\d+]/g, '');
  if (!cleaned) return 'Номер телефона обязателен для заполнения';
  if (!/^\+998\d{9}$/.test(cleaned)) return 'Формат: +998XXXXXXXXX';
  return '';
}

// Валидация организации
function validateOrganization() {
  if (!formData.value.organizationName.trim()) {
    return 'Введите название организации';
  }
  return '';
}

// Следующий шаг
function nextStep() {
  // Очистка ошибок
  errors.value = { fullName: '', phone: '', organizationName: '' };
  generalError.value = '';

  // Валидация текущего шага
  if (step.value === 1) {
    const error = validateFullName(formData.value.fullName);
    if (error) {
      errors.value.fullName = error;
      return;
    }
  } else if (step.value === 2) {
    const error = validatePhone(formData.value.phone);
    if (error) {
      errors.value.phone = error;
      return;
    }
    
    // Нормализация телефона
    formData.value.phone = formData.value.phone.replace(/[^\d+]/g, '');
    if (formData.value.phone.startsWith('998') && !formData.value.phone.startsWith('+')) {
      formData.value.phone = '+' + formData.value.phone;
    }
    if (formData.value.phone.startsWith('9') && formData.value.phone.length === 9) {
      formData.value.phone = '+998' + formData.value.phone;
    }

    // Загрузка списка организаций
    loadOrganizations();
  }

  step.value++;
}

// Предыдущий шаг
function prevStep() {
  step.value--;
  errors.value = { fullName: '', phone: '', organizationName: '' };
  generalError.value = '';
}

// Загрузка организаций
async function loadOrganizations() {
  if (organizations.value.length > 0) return; // Уже загружены

  loadingOrgs.value = true;
  try {
    const data = await $fetch('/api/tg-app/organizations', {
      query: { limit: 1000 }
    });
    organizations.value = data.data || [];
  } catch (error) {
    console.error('Ошибка загрузки организаций:', error);
    generalError.value = 'Не удалось загрузить список организаций';
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
  generalError.value = '';

  try {
    const response = await $fetch('/api/tg-app/register', {
      method: 'POST',
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
    emit('registered', response);

    // Показываем уведомление от Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert('✅ Заявка успешно отправлена! Ожидайте одобрения администратора.');
    }

  } catch (error) {
    console.error('Ошибка регистрации:', error);
    generalError.value = error.data?.message || 'Произошла ошибка при регистрации. Попробуйте позже.';
  } finally {
    submitting.value = false;
  }
}

// Автозаполнение из Telegram данных
watch(() => props.telegramData, (data) => {
  if (data?.user) {
    // Пытаемся автозаполнить ФИО из Telegram
    const firstName = data.user.first_name || '';
    const lastName = data.user.last_name || '';
    if (firstName && !formData.value.fullName) {
      formData.value.fullName = `${lastName} ${firstName}`.trim();
    }
  }
}, { immediate: true });
</script>

<style scoped>
.tg-registration-form {
  max-width: 500px;
  margin: 0 auto;
}

/* Шаг формы */
.tg-form-step {
  background: rgba(30, 41, 59, 0.6);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  padding: 2rem;
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
  text-align: center;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  color: #94a3b8;
}

.tg-step-number {
  font-size: 2rem;
  font-weight: 700;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.tg-step-total {
  margin-left: 0.25rem;
}

/* Заголовки */
.tg-form-step h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #f1f5f9;
}

.tg-form-step p {
  color: #94a3b8;
  margin-bottom: 1.5rem;
  line-height: 1.6;
}

/* Группа формы */
.tg-form-group {
  margin-bottom: 1.5rem;
}

/* Инпуты */
.tg-input {
  width: 100%;
  padding: 0.875rem 1rem;
  background: rgba(15, 23, 42, 0.8);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 1rem;
  transition: all 0.2s;
}

.tg-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.tg-input.error {
  border-color: #ef4444;
}

.tg-input::placeholder {
  color: #64748b;
}

/* Текст ошибки */
.tg-error-text {
  color: #f87171;
  font-size: 0.875rem;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.tg-error-text::before {
  content: '⚠';
}

/* Общая ошибка */
.tg-general-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-top: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-error-icon {
  font-size: 1.5rem;
}

.tg-general-error p {
  margin: 0;
  color: #f87171;
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
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.5rem;
  background: #1e293b; 
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 0.5rem;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tg-org-item {
  width: 100%;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #f1f5f9;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s;
  margin-bottom: 0.25rem;
}

.tg-org-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.tg-org-name {
  flex: 1;
  font-size: 0.9375rem;
}

.tg-org-check {
  color: #3b82f6;
  font-weight: 700;
  font-size: 1rem;
}

/* Действия формы */
.tg-form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

/* Кнопки */
.tg-btn-next,
.tg-btn-back,
.tg-btn-submit {
  flex: 1;
  padding: 0.875rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-next,
.tg-btn-submit {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tg-btn-next:active,
.tg-btn-submit:active {
  transform: translateY(1px);
}

.tg-btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.tg-btn-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tg-btn-loading {
  display: flex;
  align-items: center;
  justify-content: center;
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
  to { transform: rotate(360deg); }
}
</style>
