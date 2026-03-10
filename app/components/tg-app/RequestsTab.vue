<template>
  <div class="tg-requests-tab">

    <!-- ======================== ЭКРАН: СПИСОК ЗАЯВОК ======================== -->
    <div v-if="screen === 'list'">
      <!-- Заголовок + кнопка новой заявки -->
      <div class="tg-list-header">
        <h3>Мои заявки</h3>
        <span v-if="requests.length > 0" class="tg-count">{{ requests.length }}</span>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка заявок...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <div class="tg-icon-wrapper tg-error-icon-wrapper">
          <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p>{{ error }}</p>
        <button @click="loadRequests" class="tg-btn-retry">Повторить</button>
      </div>

      <!-- Пустой список -->
      <div v-else-if="requests.length === 0 && !loading" class="tg-empty-state">
        <div class="tg-icon-wrapper">
          <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3>Заявок пока нет</h3>
        <p>Подайте первую заявку на обучение сотрудников</p>
      </div>

      <!-- Список заявок -->
      <div v-else class="tg-requests-list">
        <div
          v-for="req in requests"
          :key="req.id"
          class="tg-request-card"
          @click="openDetail(req)"
        >
          <!-- Дата + статус -->
          <div class="tg-request-top">
            <span class="tg-request-date">{{ formatDate(req.createdAt) }}</span>
            <span class="tg-status-badge" :class="`tg-status-${req.status}`">
              {{ STATUS_LABELS[req.status] }}
            </span>
          </div>

          <!-- Содержимое заявки -->
          <div class="tg-request-body">
            <div class="tg-request-counts">
              <span class="tg-req-meta">
                📋 {{ req.totalItemsCount }} {{ pluralItems(req.totalItemsCount) }}
              </span>
              <span class="tg-req-meta">
                👥 {{ req.totalStudentsCount }} {{ pluralStudents(req.totalStudentsCount) }}
              </span>
            </div>

            <!-- Курсы в заявке (кратко) -->
            <div class="tg-request-courses">
              <div
                v-for="(courseName, idx) in uniqueCourseNames(req.items)"
                :key="idx"
                class="tg-course-chip"
              >
                {{ courseName }}
              </div>
            </div>
          </div>

          <!-- Доп. статусы -->
          <div class="tg-request-footer">
            <span class="tg-sub-status" :class="req.contractStatus === 'signed' ? 'ok' : 'pending'">
              {{ req.contractStatus === 'signed' ? '✓ Договор' : '⏳ Договор' }}
            </span>
            <span class="tg-sub-status" :class="req.paymentStatus === 'paid' ? 'ok' : 'pending'">
              {{ req.paymentStatus === 'paid' ? '✓ Оплачено' : '⏳ Оплата' }}
            </span>
          </div>

          <!-- Комментарий администратора -->
          <div v-if="req.adminComment" class="tg-admin-comment">
            💬 {{ req.adminComment }}
          </div>
        </div>
      </div>

      <!-- Кнопка "Подать новую заявку" -->
      <div class="tg-fab-container">
        <button class="tg-fab-btn" @click="startNewRequest">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Подать заявку
        </button>
      </div>
    </div>

    <!-- ======================== ЭКРАН: ДЕТАЛИ ЗАЯВКИ ======================== -->
    <div v-else-if="screen === 'detail' && selectedRequest" class="tg-detail-screen">
      <div class="tg-detail-header">
        <button class="tg-back-btn" @click="screen = 'list'">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Назад
        </button>
        <h3>Заявка от {{ formatDate(selectedRequest.createdAt) }}</h3>
      </div>

      <!-- Статусы -->
      <div class="tg-detail-statuses">
        <div class="tg-detail-stat-row">
          <span class="tg-detail-label">Статус заявки</span>
          <span class="tg-status-badge" :class="`tg-status-${selectedRequest.status}`">
            {{ STATUS_LABELS[selectedRequest.status] }}
          </span>
        </div>
        <div class="tg-detail-stat-row">
          <span class="tg-detail-label">Договор</span>
          <span class="tg-sub-status" :class="selectedRequest.contractStatus === 'signed' ? 'ok' : 'pending'">
            {{ selectedRequest.contractStatus === 'signed' ? '✓ Подписан' : '⏳ Не подписан' }}
          </span>
        </div>
        <div class="tg-detail-stat-row">
          <span class="tg-detail-label">Оплата</span>
          <span class="tg-sub-status" :class="selectedRequest.paymentStatus === 'paid' ? 'ok' : 'pending'">
            {{ selectedRequest.paymentStatus === 'paid' ? '✓ Оплачено' : '⏳ Не оплачено' }}
          </span>
        </div>
        <div v-if="selectedRequest.adminComment" class="tg-admin-comment-detail">
          <div class="tg-detail-label">Комментарий</div>
          <p>{{ selectedRequest.adminComment }}</p>
        </div>
      </div>

      <!-- Позиции заявки -->
      <div class="tg-detail-items">
        <h4>Состав заявки ({{ selectedRequest.items?.length || 0 }} позиций)</h4>
        <div
          v-for="(item, idx) in selectedRequest.items"
          :key="item.id"
          class="tg-item-card"
        >
          <div class="tg-item-header">
            <span class="tg-item-num">{{ idx + 1 }}</span>
            <div class="tg-item-info">
              <strong>{{ item.courseName }}</strong>
              <span class="tg-item-month">📅 {{ formatMonth(item.trainingMonth) }}</span>
            </div>
            <span class="tg-item-count">{{ item.studentsCount }} чел.</span>
          </div>
          <div v-if="item.groupLabel" class="tg-item-label">
            Группа: {{ item.groupLabel }}
          </div>
        </div>
      </div>
    </div>

    <!-- ======================== ЭКРАН: ФОРМА НОВОЙ ЗАЯВКИ ======================== -->
    <div v-else-if="screen === 'form'" class="tg-form-screen">
      <!-- Шапка формы -->
      <div class="tg-form-header">
        <button class="tg-back-btn" @click="cancelForm">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Отмена
        </button>
        <h3>Новая заявка</h3>
      </div>

      <!-- Список позиций (добавленные курсы/группы) -->
      <div v-if="formItems.length > 0" class="tg-form-items">
        <div class="tg-form-items-header">
          <span>Добавлено позиций: {{ formItems.length }}</span>
        </div>
        <div
          v-for="(item, idx) in formItems"
          :key="idx"
          class="tg-form-item-row"
        >
          <div class="tg-form-item-info">
            <strong>{{ item.courseName }}</strong>
            <span>📅 {{ formatMonth(item.trainingMonth) }} · {{ item.studentIds.length }} чел.</span>
            <span v-if="item.groupLabel" class="tg-item-label-small">{{ item.groupLabel }}</span>
          </div>
          <button class="tg-remove-btn" @click="removeItem(idx)">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Блок добавления новой позиции -->
      <div class="tg-add-item-block">
        <div class="tg-add-item-title">
          {{ formItems.length === 0 ? 'Добавьте позицию' : 'Добавить ещё позицию' }}
        </div>

        <!-- Шаг 1: Выбор курса -->
        <div class="tg-form-field">
          <label class="tg-field-label">Курс обучения <span class="tg-required">*</span></label>
          <div v-if="coursesLoading" class="tg-field-loading">Загрузка курсов...</div>
          <select v-else v-model="newItem.courseId" class="tg-select" @change="onCourseChange">
            <option value="">Выберите курс</option>
            <option v-for="c in courses" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
          <div v-if="selectedCourse" class="tg-course-hours">
            ⏱ Продолжительность: {{ selectedCourse.durationHours }} ч.
          </div>
          <p v-if="itemErrors.courseId" class="tg-field-error">{{ itemErrors.courseId }}</p>
        </div>

        <!-- Шаг 2: Период обучения -->
        <div class="tg-form-field">
          <label class="tg-field-label">Период обучения <span class="tg-required">*</span></label>
          <div class="tg-period-selects">
            <select v-model="selectedYear" class="tg-select flex-1">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }} год</option>
            </select>
            <select v-model="selectedMonth" class="tg-select flex-1">
              <option v-for="m in MONTHS_LIST" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
          <p v-if="itemErrors.trainingMonth" class="tg-field-error">{{ itemErrors.trainingMonth }}</p>
        </div>

        <!-- Шаг 3: Название группы (опционально) -->
        <div class="tg-form-field">
          <label class="tg-field-label">Название группы <span class="tg-optional">(необязательно)</span></label>
          <input
            v-model="newItem.groupLabel"
            type="text"
            placeholder="Например: Бухгалтерия, Смена 1"
            class="tg-input"
          />
        </div>

        <!-- Шаг 4: Выбор сотрудников -->
        <div class="tg-form-field">
          <div class="flex justify-between items-center mb-1">
            <label class="tg-field-label m-0">
              Сотрудники <span class="tg-required">*</span>
              <span v-if="newItem.studentIds.length > 0" class="tg-selected-count">
                {{ newItem.studentIds.length }}
              </span>
            </label>
            <button class="text-blue-600 text-xs font-semibold" @click="showSmartInput = !showSmartInput">
              {{ showSmartInput ? 'Обычный выбор' : 'Умный ввод' }}
            </button>
          </div>

          <!-- Умный ввод (Текстовое поле) -->
          <div v-if="showSmartInput" class="tg-smart-input-block">
            <p class="text-xs text-gray-500 mb-2">Введите ФИО или ПИНФЛ (по одному в строке):</p>
            <textarea
              v-model="smartInputText"
              class="tg-smart-textarea"
              placeholder="Иванов Иван Иванович&#10;12345678901234"
              rows="4"
            ></textarea>
            <button 
              class="tg-smart-apply-btn" 
              :disabled="smartImporting" 
              @click="processSmartInput"
            >
              <span v-if="smartImporting">Обработка...</span>
              <span v-else>Найти и добавить</span>
            </button>
          </div>

          <!-- Поиск по сотрудникам -->
          <div v-else class="tg-standard-selection">
            <div class="tg-search-wrapper" style="margin-bottom: 0.5rem">
              <div class="tg-search-icon">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                v-model="studentSearch"
                type="text"
                placeholder="Поиск по ФИО или ПИНФЛ..."
                class="tg-search-input"
              />
            </div>

            <div class="tg-select-all-row">
              <button class="tg-select-all-btn" @click="selectAllStudents">Выбрать из списка</button>
              <button class="tg-select-all-btn" @click="deselectAllStudents" v-if="newItem.studentIds.length > 0">
                Снять всё
              </button>
            </div>

            <!-- Список сотрудников -->
            <div v-if="studentsLoading" class="tg-field-loading">Загрузка...</div>
            <div v-else-if="filteredStudents.length === 0" class="tg-no-students">
              Никто не найден
            </div>
            <div v-else class="tg-students-checklist">
              <label
                v-for="student in filteredStudents"
                :key="student.id"
                class="tg-check-item"
                :class="{ checked: newItem.studentIds.includes(student.id) }"
              >
                <input
                  type="checkbox"
                  :value="student.id"
                  v-model="newItem.studentIds"
                  class="tg-checkbox"
                />
                <div class="tg-check-avatar">{{ getInitials(student.fullName) }}</div>
                <div class="tg-check-info">
                  <span class="tg-check-name">{{ student.fullName }}</span>
                  <span v-if="student.pinfl" class="tg-check-position">ПИНФЛ: {{ student.pinfl }}</span>
                </div>
              </label>
            </div>
          </div>
          <p v-if="itemErrors.studentIds" class="tg-field-error">{{ itemErrors.studentIds }}</p>
        </div>

        <!-- Кнопка: Добавить позицию -->
        <button class="tg-add-item-btn" @click="addItem">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Сохранить и добавить ещё
        </button>
      </div>

      <!-- Итоговая кнопка отправки -->
      <div v-if="formItems.length > 0" class="tg-submit-block">
        <div class="tg-submit-summary">
          <span>Итого: {{ formItems.length }} {{ pluralItems(formItems.length) }},
            {{ totalStudentsInForm }} {{ pluralStudents(totalStudentsInForm) }}
          </span>
        </div>
        <button
          class="tg-submit-btn"
          :disabled="submitting"
          @click="submitRequest"
        >
          <div v-if="submitting" class="tg-spinner-sm"></div>
          <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {{ submitting ? 'Отправка...' : 'Отправить заявку' }}
        </button>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";

// ─── Типы ───
interface Student {
  id: string;
  fullName: string;
  pinfl: string | null;
  position?: string;
}

interface Course {
  id: string;
  name: string;
  durationHours: number | null;
}

interface TrainingItem {
  id: string;
  courseId: string;
  courseName: string;
  trainingMonth: string;
  studentsCount: number;
  groupLabel: string | null;
}

interface FormTrainingItem {
  courseId: string;
  courseName: string;
  trainingMonth: string;
  studentIds: string[];
  groupLabel: string | null;
}

interface TrainingRequest {
  id: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  contractStatus: 'not_signed' | 'signed';
  paymentStatus: 'not_paid' | 'paid';
  adminComment: string | null;
  totalItemsCount: number;
  totalStudentsCount: number;
  createdAt: string | Date;
  items: TrainingItem[];
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        showAlert: (message: string) => void;
        [key: string]: any;
      };
    };
  }
}

const props = defineProps<{
  representative: any;
  organizationId: string | number;
}>();

// ─── Состояние ───
const screen = ref("list");

// ─── Навигация по месяцам
const selectedYear  = ref(new Date().getFullYear());
const selectedMonth = ref(new Date().getMonth() + 1);
const availableYears = [new Date().getFullYear(), new Date().getFullYear() + 1];
const MONTHS_LIST = [
  { id: 1,  name: "Январь" },   { id: 2,  name: "Февраль" },
  { id: 3,  name: "Март" },     { id: 4,  name: "Апрель" },
  { id: 5,  name: "Май" },      { id: 6,  name: "Июнь" },
  { id: 7,  name: "Июль" },     { id: 8,  name: "Август" },
  { id: 9,  name: "Сентябрь" }, { id: 10, name: "Октябрь" },
  { id: 11, name: "Ноябрь" },   { id: 12, name: "Декабрь" }
];



// ─── Статусы заявки
const STATUS_LABELS = {
  pending:     "На рассмотрении",
  approved:    "Одобрена",
  rejected:    "Отклонена",
  in_progress: "В процессе",
  completed:   "Завершена",
};

// ─── Данные
const loading  = ref(false);
const error    = ref<string | null>(null);
const requests = ref<TrainingRequest[]>([]);
const selectedRequest = ref<TrainingRequest | null>(null);
const formItems   = ref<FormTrainingItem[]>([]);
const submitting  = ref(false);

const newItem = ref<FormTrainingItem>({
  courseId:      "",
  courseName:    "",
  trainingMonth: "",
  groupLabel:    "",
  studentIds:    [],
});
const itemErrors = ref<Record<string, string>>({});

// При изменении года/месяца обновляем newItem.trainingMonth
watch([selectedYear, selectedMonth], () => {
  newItem.value.trainingMonth = `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`;
}, { immediate: true });

const courses        = ref<Course[]>([]);
const coursesLoading = ref(false);
const allStudents    = ref<Student[]>([]);
const studentsLoading = ref(false);
const studentSearch  = ref("");

// ─── "Умный" ввод (AI-like)
const smartInputText = ref("");
const smartImporting = ref(false);
const showSmartInput = ref(false);

// Выбранный курс для отображения часов
const selectedCourse = computed(() => 
  courses.value.find(c => c.id === newItem.value.courseId)
);

// ─── Фильтрованный список (если студентов много, ограничиваем показ)
const filteredStudents = computed(() => {
  if (!studentSearch.value.trim()) {
    // Если поиск пуст, показываем только первые 5 (или уже выбранных)
    return allStudents.value.filter(s => 
      newItem.value.studentIds.includes(s.id)
    ).concat(allStudents.value.filter(s => !newItem.value.studentIds.includes(s.id)).slice(0, 10));
  }
  const q = studentSearch.value.toLowerCase();
  return allStudents.value.filter(
    (s) => s.fullName.toLowerCase().includes(q) ||
           (s.pinfl && s.pinfl.includes(q))
  );
});

const totalStudentsInForm = computed(() =>
  formItems.value.reduce((sum, item) => sum + item.studentIds.length, 0)
);

// ─── Методы
watch(() => props.representative?.id, (id) => {
  if (id) loadRequests();
}, { immediate: true });

async function loadRequests() {
  loading.value = true;
  error.value   = null;
  try {
    const res = await ($fetch as any)("/api/tg-app/training-requests", {
      params: { representativeId: props.representative.id },
    });
    requests.value = (res.requests as TrainingRequest[]) || [];
  } catch (err: any) {
    error.value = err.data?.message || "Не удалось загрузить заявки";
  } finally {
    loading.value = false;
  }
}

async function loadCourses() {
  coursesLoading.value = true;
  try {
    const res = await ($fetch as any)("/api/tg-app/courses");
    courses.value = (res.courses as Course[]) || [];
  } catch (err: any) {
    console.error("Ошибка загрузки курсов:", err);
  } finally {
    coursesLoading.value = false;
  }
}

async function loadStudents() {
  studentsLoading.value = true;
  try {
    const res = await ($fetch as any)("/api/tg-app/students", {
      params: { organizationId: props.organizationId as string, mode: "all" },
    });
    allStudents.value = (res.students as Student[]) || [];
  } catch (err: any) {
    console.error("Ошибка загрузки сотрудников:", err);
  } finally {
    studentsLoading.value = false;
  }
}

function openDetail(req: TrainingRequest) {
  selectedRequest.value = req;
  screen.value = "detail";
}

function closeDetail() {
  selectedRequest.value = null;
  screen.value = "list";
}

function startNewRequest() {
  formItems.value = [];
  resetNewItem();
  loadCourses();
  loadStudents();
  screen.value = "form";
}

function cancelForm() {
  if (formItems.value.length > 0) {
    if (!confirm("Отменить заявку? Все добавленные позиции будут потеряны.")) return;
  }
  screen.value = "list";
}

function resetNewItem() {
  newItem.value = { 
    courseId: "", 
    courseName: "", 
    trainingMonth: `${selectedYear.value}-${String(selectedMonth.value).padStart(2, '0')}`, 
    groupLabel: "", 
    studentIds: [] 
  };
  itemErrors.value = {};
  studentSearch.value = "";
  smartInputText.value = "";
}

function onCourseChange() {
  newItem.value.courseName = selectedCourse.value?.name || "";
}

function selectAllStudents() {
  newItem.value.studentIds = filteredStudents.value.map((s) => s.id);
}
function deselectAllStudents() {
  newItem.value.studentIds = [];
}

// Умный импорт
async function processSmartInput() {
  if (!smartInputText.value.trim()) return;
  smartImporting.value = true;
  
  const lines = smartInputText.value.split('\n').map(l => l.trim()).filter(l => l.length > 3);
  let foundCount = 0;
  
  for (const line of lines) {
    const q = line.toLowerCase();
    // Ищем в загруженном списке
    const student = allStudents.value.find(s => 
      s.fullName.toLowerCase().includes(q) || (s.pinfl && s.pinfl.includes(q))
    );
    
    if (student && !newItem.value.studentIds.includes(student.id)) {
      newItem.value.studentIds.push(student.id);
      foundCount++;
    }
  }
  
  smartImporting.value = false;
  showSmartInput.value = false;
  smartInputText.value = "";
}

function addItem() {
  itemErrors.value = {};
  let valid = true;

  if (!newItem.value.courseId) {
    itemErrors.value.courseId = "Выберите курс";
    valid = false;
  }
  if (!newItem.value.trainingMonth) {
    itemErrors.value.trainingMonth = "Выберите период обучения";
    valid = false;
  }
  if (newItem.value.studentIds.length === 0) {
    itemErrors.value.studentIds = "Выберите хотя бы одного сотрудника";
    valid = false;
  }

  if (!valid) return;

  formItems.value.push({
    courseId:      newItem.value.courseId,
    courseName:    newItem.value.courseName,
    trainingMonth: newItem.value.trainingMonth,
    groupLabel:    newItem.value.groupLabel || null,
    studentIds:    [...newItem.value.studentIds],
  });

  resetNewItem();
}

function removeItem(idx: number) {
  formItems.value.splice(idx, 1);
}

async function submitRequest() {
  if (formItems.value.length === 0) return;

  submitting.value = true;
  try {
    const res = await ($fetch as any)("/api/tg-app/training-requests", {
      method: "POST",
      body: {
        representativeId: props.representative.id,
        organizationId:   props.organizationId,
        items:            formItems.value,
      },
    });

    if (res.success) {
      screen.value = "list";
      await loadRequests();
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("✅ Заявка успешно отправлена!");
      }
    }
  } catch (err: any) {
    const msg = err.data?.message || "Ошибка при отправке заявки";
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.showAlert(`❌ ${msg}`);
    } else {
      alert(msg);
    }
  } finally {
    submitting.value = false;
  }
}

// ─── Утилиты
function uniqueCourseNames(items: any[]) {
  if (!items) return [];
  const set = new Set(items.map((i: any) => i.courseName));
  return [...set];
}

function formatDate(dateStr: any) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Tashkent" });
}

function formatMonth(monthStr: any) {
  if (!monthStr || typeof monthStr !== 'string' || !monthStr.includes('-')) return monthStr || "";
  const parts = monthStr.split("-");
  const year = parts[0];
  const month = parts[1];
  if (!year || !month) return monthStr;
  const names = ["Янв","Фев","Мар","Апр","Май","Июн","Июл","Авг","Сен","Окт","Ноя","Дек"];
  const mIdx = parseInt(month) - 1;
  if (isNaN(mIdx) || mIdx < 0 || mIdx > 11) return monthStr;
  return `${names[mIdx]} ${year}`;
}

function getInitials(name: string | null | undefined) {
  if (!name || typeof name !== 'string') return "?";
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(" ").filter(p => p.length > 0);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return parts[0].charAt(0) + parts[1].charAt(0);
  }
  return trimmed.charAt(0) || "?";
}

function pluralItems(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "позиция";
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return "позиции";
  return "позиций";
}

function pluralStudents(n: number) {
  if (n % 10 === 1 && n % 100 !== 11) return "сотрудник";
  if ([2,3,4].includes(n % 10) && ![12,13,14].includes(n % 100)) return "сотрудника";
  return "сотрудников";
}
</script>

<style scoped>
.tg-requests-tab { padding: 0; width: 100%; }

/* ─── Общие переиспользуемые классы ─── */
.tg-loading-block,
.tg-error-block,
.tg-empty-state { text-align: center; padding: 3rem 1rem; }

.tg-icon-wrapper {
  width: 64px; height: 64px; margin: 0 auto 1rem;
  background: #f1f5f9; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; color: #64748b;
}
.tg-error-icon-wrapper { background: #fee2e2; color: #dc2626; }

.tg-loading-block { display: flex; flex-direction: column; align-items: center; gap: 1rem; }
.tg-loading-block p, .tg-empty-state p { color: #64748b; font-size: 0.9375rem; }
.tg-empty-state h3 { font-size: 1.125rem; font-weight: 700; margin-bottom: 0.5rem; color: #1e293b; }
.tg-error-block p  { color: #dc2626; margin-bottom: 1rem; }

.tg-spinner {
  width: 40px; height: 40px;
  border: 3px solid #e2e8f0; border-top-color: #2563eb;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
.tg-spinner-sm {
  width: 20px; height: 20px;
  border: 2px solid rgba(255,255,255,0.4); border-top-color: white;
  border-radius: 50%; animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.tg-btn-retry {
  background: #2563eb; color: white; border: none;
  padding: 0.75rem 1.5rem; border-radius: 10px; font-weight: 600; cursor: pointer;
}
.tg-back-btn {
  display: flex; align-items: center; gap: 0.375rem;
  background: none; border: none; color: #2563eb; font-size: 0.9375rem;
  font-weight: 600; cursor: pointer; padding: 0;
}

/* ─── Заголовок list ─── */
.tg-list-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 1rem; padding: 0 0.25rem;
}
.tg-list-header h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
.tg-count {
  background: #eff6ff; color: #2563eb;
  padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8125rem; font-weight: 600;
}

/* ─── Карточка заявки ─── */
.tg-requests-list { display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 5rem; }

.tg-request-card {
  background: white; border-radius: 14px;
  border: 1px solid #e2e8f0; padding: 1rem;
  cursor: pointer; transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}
.tg-request-card:active { transform: scale(0.98); background: #f8fafc; }

.tg-request-top {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.625rem;
}
.tg-request-date { font-size: 0.8125rem; color: #64748b; }

/* Статусы */
.tg-status-badge {
  display: inline-flex; align-items: center;
  padding: 0.25rem 0.625rem; border-radius: 10px;
  font-size: 0.75rem; font-weight: 600;
}
.tg-status-pending     { background: #fef3c7; color: #92400e; }
.tg-status-approved    { background: #d1fae5; color: #065f46; }
.tg-status-rejected    { background: #fee2e2; color: #991b1b; }
.tg-status-in_progress { background: #dbeafe; color: #1e40af; }
.tg-status-completed   { background: #f0fdf4; color: #166534; }

.tg-request-body { margin-bottom: 0.625rem; }
.tg-request-counts { display: flex; gap: 1rem; margin-bottom: 0.5rem; }
.tg-req-meta { font-size: 0.8125rem; color: #475569; }
.tg-request-courses { display: flex; flex-wrap: wrap; gap: 0.375rem; }
.tg-course-chip {
  background: #eff6ff; color: #1d4ed8;
  padding: 0.2rem 0.625rem; border-radius: 8px; font-size: 0.75rem; font-weight: 500;
}

.tg-request-footer { display: flex; gap: 0.75rem; margin-top: 0.625rem; }
.tg-sub-status {
  font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.5rem;
  border-radius: 6px;
}
.tg-sub-status.ok      { background: #d1fae5; color: #065f46; }
.tg-sub-status.pending { background: #f1f5f9; color: #64748b; }

.tg-admin-comment {
  margin-top: 0.625rem; padding: 0.5rem 0.75rem;
  background: #f8fafc; border-left: 3px solid #2563eb;
  border-radius: 0 8px 8px 0; font-size: 0.8125rem; color: #475569;
}

/* FAB кнопка */
.tg-fab-container {
  position: fixed; bottom: 5rem; left: 0; right: 0;
  display: flex; justify-content: center; padding: 0 1rem; z-index: 50;
}
.tg-fab-btn {
  display: flex; align-items: center; gap: 0.5rem;
  background: #2563eb; color: white; border: none;
  padding: 0.875rem 1.75rem; border-radius: 50px;
  font-size: 0.9375rem; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 12px rgba(37,99,235,0.4);
  transition: all 0.2s;
}
.tg-fab-btn:active { transform: scale(0.97); }

/* ─── Экран деталей ─── */
.tg-detail-header {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: 1rem;
}
.tg-detail-header h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }
.tg-detail-statuses {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  padding: 1rem; margin-bottom: 1rem;
}
.tg-detail-stat-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 0.5rem 0; border-bottom: 1px solid #f1f5f9;
}
.tg-detail-stat-row:last-child { border-bottom: none; }
.tg-detail-label { font-size: 0.875rem; color: #64748b; }
.tg-admin-comment-detail {
  padding-top: 0.5rem; border-top: 1px solid #f1f5f9;
}
.tg-admin-comment-detail p { margin-top: 0.25rem; font-size: 0.875rem; color: #1e293b; }

.tg-detail-items h4 { font-size: 0.9375rem; font-weight: 700; color: #1e293b; margin-bottom: 0.75rem; }
.tg-item-card {
  background: white; border-radius: 12px; border: 1px solid #e2e8f0;
  padding: 0.875rem; margin-bottom: 0.5rem;
}
.tg-item-header { display: flex; align-items: flex-start; gap: 0.75rem; }
.tg-item-num {
  width: 28px; height: 28px; background: #eff6ff; color: #2563eb;
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.tg-item-info { flex: 1; }
.tg-item-info strong { display: block; font-size: 0.9375rem; color: #1e293b; font-weight: 600; }
.tg-item-month { font-size: 0.8125rem; color: #64748b; }
.tg-item-count { font-size: 0.875rem; font-weight: 700; color: #2563eb; white-space: nowrap; }
.tg-item-label { font-size: 0.8125rem; color: #64748b; margin-top: 0.375rem; }

/* ─── Форма ─── */
.tg-form-header {
  display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;
}
.tg-form-header h3 { font-size: 1rem; font-weight: 700; color: #1e293b; margin: 0; }

.tg-form-items {
  background: #f0fdf4; border: 1px solid #bbf7d0;
  border-radius: 12px; padding: 0.875rem; margin-bottom: 1rem;
}
.tg-form-items-header { font-size: 0.8125rem; font-weight: 600; color: #065f46; margin-bottom: 0.75rem; }
.tg-form-item-row {
  display: flex; align-items: center; gap: 0.75rem;
  background: white; border-radius: 10px; padding: 0.625rem 0.875rem; margin-bottom: 0.5rem;
}
.tg-form-item-info { flex: 1; }
.tg-form-item-info strong { display: block; font-size: 0.875rem; color: #1e293b; }
.tg-form-item-info span { display: block; font-size: 0.75rem; color: #64748b; }
.tg-item-label-small { color: #2563eb !important; }
.tg-remove-btn {
  background: #fee2e2; color: #dc2626; border: none;
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center; cursor: pointer;
  flex-shrink: 0; transition: background 0.2s;
}
.tg-remove-btn:active { background: #fca5a5; }

.tg-add-item-block {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  padding: 1rem; margin-bottom: 1rem;
}
.tg-add-item-title { font-size: 0.9375rem; font-weight: 700; color: #1e293b; margin-bottom: 1rem; }

.tg-form-field { margin-bottom: 1rem; }
.tg-field-label {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; font-weight: 600; color: #374151; margin-bottom: 0.5rem;
}
.tg-required { color: #dc2626; }
.tg-optional { font-weight: 400; color: #94a3b8; font-size: 0.8125rem; }
.tg-selected-count {
  margin-left: auto; font-size: 0.8125rem; font-weight: 700;
  color: #2563eb; background: #eff6ff; padding: 0.125rem 0.5rem; border-radius: 8px;
}
.tg-field-error { color: #dc2626; font-size: 0.8125rem; margin-top: 0.375rem; }
.tg-field-loading { color: #94a3b8; font-size: 0.875rem; padding: 0.5rem 0; }

.tg-select {
  width: 100%; padding: 0.875rem 2.5rem 0.875rem 1rem;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  color: #1e293b; font-size: 0.9375rem; cursor: pointer; appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat; background-position: right 0.75rem center; background-size: 1.25rem;
}
.tg-select:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }

.tg-input {
  width: 100%; padding: 0.875rem 1rem;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  color: #1e293b; font-size: 0.9375rem;
}
.tg-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.tg-input::placeholder { color: #94a3b8; }

/* ─── Поиск ─── */
.tg-search-wrapper { position: relative; width: 100%; }
.tg-search-icon {
  position: absolute; left: 1rem; top: 50%; transform: translateY(-50%);
  color: #94a3b8; pointer-events: none; display: flex; align-items: center;
}
.tg-search-input {
  width: 100%; padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px;
  color: #1e293b; font-size: 0.9375rem;
}
.tg-search-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
.tg-search-input::placeholder { color: #94a3b8; }

/* ─── Выбрать всех ─── */
.tg-select-all-row { display: flex; gap: 0.5rem; margin-bottom: 0.75rem; }
.tg-select-all-btn {
  font-size: 0.8125rem; font-weight: 600; color: #2563eb;
  background: #eff6ff; border: none; padding: 0.375rem 0.875rem;
  border-radius: 8px; cursor: pointer;
}

/* ─── Чеклист сотрудников ─── */
.tg-no-students { color: #94a3b8; font-size: 0.875rem; padding: 1rem 0; text-align: center; }
.tg-students-checklist {
  max-height: 300px; overflow-y: auto;
  border: 1px solid #e2e8f0; border-radius: 12px;
}
.tg-check-item {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.75rem 1rem; cursor: pointer;
  border-bottom: 1px solid #f1f5f9; transition: background 0.15s;
}
.tg-check-item:last-child { border-bottom: none; }
.tg-check-item.checked { background: #eff6ff; }
.tg-check-item:active  { background: #f1f5f9; }

.tg-checkbox { display: none; } /* Скрываем стандартный checkbox, стиль через .checked */
.tg-check-item::before {
  content: "";
  width: 20px; height: 20px; flex-shrink: 0;
  border: 2px solid #cbd5e1; border-radius: 6px;
  transition: all 0.15s;
  order: -1;
}
.tg-check-item.checked::before {
  background: #2563eb; border-color: #2563eb;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='white' viewBox='0 0 20 20'%3E%3Cpath fill-rule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clip-rule='evenodd'%3E%3C/path%3E%3C/svg%3E");
  background-size: 14px; background-position: center; background-repeat: no-repeat;
}

.tg-check-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #e2e8f0; color: #64748b;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.8125rem; font-weight: 700; flex-shrink: 0;
}
.tg-check-item.checked .tg-check-avatar { background: #dbeafe; color: #1d4ed8; }
.tg-check-info { flex: 1; min-width: 0; }
.tg-check-name { display: block; font-size: 0.875rem; font-weight: 600; color: #1e293b; }
.tg-check-position { display: block; font-size: 0.75rem; color: #64748b; }

/* ─── Кнопка добавить позицию ─── */
.tg-add-item-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: #f0fdf4; color: #065f46; border: 2px dashed #86efac;
  padding: 0.875rem; border-radius: 12px;
  font-size: 0.9375rem; font-weight: 600; cursor: pointer; transition: all 0.2s;
}
.tg-add-item-btn:active { background: #dcfce7; }

/* ─── Блок итого + отправка ─── */
.tg-submit-block {
  background: white; border-radius: 14px; border: 1px solid #e2e8f0;
  padding: 1rem; margin-bottom: 1rem;
}
.tg-submit-summary { font-size: 0.875rem; color: #64748b; margin-bottom: 0.875rem; text-align: center; }
.tg-submit-btn {
  width: 100%; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
  background: #2563eb; color: white; border: none;
  padding: 1rem; border-radius: 12px;
  font-size: 1rem; font-weight: 700; cursor: pointer; transition: all 0.2s;
}
.tg-submit-btn:disabled { background: #93c5fd; cursor: not-allowed; }
.tg-submit-btn:not(:disabled):active { transform: scale(0.98); }

.tg-course-hours { margin-top: 0.375rem; font-size: 0.75rem; color: #1e40af; font-weight: 500; font-family: monospace; }
.tg-period-selects { display: flex; gap: 0.5rem; }
.tg-smart-input-block { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 0.875rem; margin-bottom: 0.75rem; }
.tg-smart-textarea { width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px; font-size: 0.8125rem; background: white; margin-bottom: 0.5rem; resize: none; font-family: monospace; }
.tg-smart-apply-btn { width: 100%; background: #2563eb; color: white; border: none; padding: 0.75rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: background 0.2s; }
.tg-smart-apply-btn:active { background: #1d4ed8; }
.tg-smart-apply-btn:disabled { background: #94a3b8; cursor: not-allowed; }
</style>
