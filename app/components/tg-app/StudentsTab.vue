<template>
  <div class="tg-students-tab">
    <!-- Проверка доступа -->
    <div v-if="!permissions?.can_view_students" class="tg-no-permission">
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
      <p>У вас нет прав на просмотр списка слушателей</p>
    </div>

    <div v-else>
      <!-- Переключатель режимов -->
      <div class="tg-view-switcher">
        <button
          class="tg-view-btn"
          :class="{ active: viewMode === 'all' }"
          @click="viewMode = 'all'"
        >
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
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          Все слушатели
        </button>
        <button
          class="tg-view-btn"
          :class="{ active: viewMode === 'groups' }"
          @click="viewMode = 'groups'"
        >
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
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          По группам
        </button>
      </div>

      <!-- Фильтры -->
      <div class="tg-filters">
        <div class="tg-search-wrapper">
          <div class="tg-search-icon">
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
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по имени..."
            class="tg-search-input"
          />
        </div>

        <select
          v-if="viewMode === 'groups'"
          v-model="selectedCourse"
          class="tg-select"
        >
          <option value="">Все курсы</option>
          <option
            v-for="course in availableCourses"
            :key="course"
            :value="course"
          >
            {{ course }}
          </option>
        </select>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка слушателей...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <div class="tg-icon-wrapper tg-error-icon-wrapper">
          <svg
            class="w-10 h-10"
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
        </div>
        <p>{{ error }}</p>
        <button @click="loadData" class="tg-btn-retry">Повторить</button>
      </div>

      <!-- РЕЖИМ: Все слушатели -->
      <template v-else-if="viewMode === 'all'">
        <div v-if="filteredAllStudents.length > 0" class="tg-all-students">
          <div class="tg-list-header">
            <h3>Слушатели организации</h3>
            <span class="tg-count">{{ filteredAllStudents.length }}</span>
          </div>

          <div class="tg-students-grid">
            <div
              v-for="student in filteredAllStudents"
              :key="student.id"
              class="tg-student-card"
              @click="openStudentDetail(student)"
            >
              <div class="tg-student-avatar">
                {{ getInitials(student.fullName) }}
              </div>
              <div class="tg-student-main">
                <h4>{{ student.fullName }}</h4>
                <p class="tg-position">{{ student.position }}</p>
                <div class="tg-student-meta">
                  <span
                    v-if="student.certificatesCount > 0"
                    class="tg-meta-badge tg-certs-badge"
                  >
                    📜 {{ student.certificatesCount }}
                  </span>
                  <span v-if="student.lastCertificateDate" class="tg-meta-date">
                    {{ student.lastCertificateDate }}
                  </span>
                </div>
              </div>
              <div class="tg-student-arrow">
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
              </div>
            </div>
          </div>
        </div>

        <div v-else class="tg-empty-state">
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <h3>Нет слушателей</h3>
          <p v-if="searchQuery">Попробуйте изменить поисковый запрос</p>
          <p v-else>В данный момент нет слушателей от вашей организации</p>
        </div>
      </template>

      <!-- РЕЖИМ: По группам -->
      <template v-else-if="viewMode === 'groups'">
        <div v-if="filteredGroupStudents.length > 0" class="tg-students-list">
          <div class="tg-list-header">
            <h3>Слушатели в группах</h3>
            <span class="tg-count">{{ filteredGroupStudents.length }}</span>
          </div>

          <!-- Группировка по группам -->
          <div
            v-for="(groupData, groupName) in groupedStudents"
            :key="groupName"
            class="tg-group-section"
          >
            <div class="tg-group-header" @click="toggleGroup(groupName)">
              <div class="tg-group-info">
                <div class="tg-group-title-row">
                  <h4>{{ groupName }}</h4>
                  <span
                    class="tg-group-status"
                    :class="getGroupStatus(groupData.endDate).class"
                  >
                    {{ getGroupStatus(groupData.endDate).label }}
                  </span>
                </div>
                <p v-if="groupData.courseName">{{ groupData.courseName }}</p>
                <div
                  v-if="groupData.startDate && groupData.endDate"
                  class="tg-group-dates"
                >
                  📅 {{ groupData.startDate }} - {{ groupData.endDate }}
                </div>
              </div>
              <div class="tg-group-toggle">
                <span class="tg-student-count">{{
                  groupData.students.length
                }}</span>
                <span
                  class="tg-toggle-icon"
                  :class="{ expanded: expandedGroups[groupName] }"
                >
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
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </span>
              </div>
            </div>

            <!-- Список студентов в группе -->
            <transition name="tg-collapse">
              <div
                v-if="expandedGroups[groupName]"
                class="tg-students-in-group"
              >
                <div
                  v-for="(student, index) in groupData.students"
                  :key="student.id || index"
                  class="tg-student-item"
                  @click="openStudentDetailByName(student.fullName, student.id)"
                >
                  <div class="tg-student-avatar">
                    {{ getInitials(student.fullName) }}
                  </div>
                  <div class="tg-student-info">
                    <h5>{{ student.fullName }}</h5>
                  </div>
                  <div class="tg-student-arrow-small">
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
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>

        <div v-else class="tg-empty-state">
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3>Нет активных групп</h3>
          <p v-if="searchQuery || selectedCourse">
            Попробуйте изменить фильтры
          </p>
          <p v-else>
            В данный момент нет активных учебных групп с вашими слушателями
          </p>
        </div>
      </template>
    </div>

    <!-- Модальное окно деталей слушателя -->
    <StudentDetailModal
      :show="showStudentModal"
      :student-id="selectedStudentId"
      :student="selectedStudent"
      :organization-id="organizationId"
      :representative-chat-id="representative?.telegramChatId"
      @close="closeStudentModal"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import StudentDetailModal from "./StudentDetailModal.vue";

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

// Состояние
const loading = ref(false);
const error = ref(null);
const viewMode = ref("all"); // "all" | "groups"
const searchQuery = ref("");
const selectedCourse = ref("");
const expandedGroups = ref({});

// Данные
const allStudents = ref([]); // Все слушатели (уникальные)
const groupStudents = ref([]); // Слушатели в группах (могут повторяться)

// Модальное окно
const showStudentModal = ref(false);
const selectedStudentId = ref(null);
const selectedStudent = ref(null);

// Загрузка данных при монтировании и смене организации
watch(
  () => props.organizationId,
  (newId) => {
    if (newId) {
      loadData();
    }
  },
  { immediate: true },
);

// Загрузка данных
async function loadData() {
  loading.value = true;
  error.value = null;

  try {
    // Загружаем оба типа данных параллельно
    const [allResponse, groupsResponse] = await Promise.all([
      $fetch("/api/tg-app/students", {
        params: { organizationId: props.organizationId, mode: "all" },
      }),
      $fetch("/api/tg-app/students", {
        params: { organizationId: props.organizationId, mode: "groups" },
      }).catch(() => ({ students: [] })), // Fallback если нет данных
    ]);

    allStudents.value = allResponse.students || [];
    groupStudents.value = groupsResponse.students || [];

    // Раскрываем первую группу по умолчанию
    if (Object.keys(groupedStudents.value).length > 0) {
      const firstGroup = Object.keys(groupedStudents.value)[0];
      expandedGroups.value[firstGroup] = true;
    }
  } catch (err) {
    console.error("Ошибка загрузки слушателей:", err);
    error.value = err.data?.message || "Не удалось загрузить список слушателей";
  } finally {
    loading.value = false;
  }
}

// Отфильтрованные слушатели (режим "Все")
const filteredAllStudents = computed(() => {
  let result = allStudents.value;

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      (s) =>
        s.fullName.toLowerCase().includes(query) ||
        (s.position && s.position.toLowerCase().includes(query)),
    );
  }

  return result;
});

// Отфильтрованные слушатели (режим "По группам")
const filteredGroupStudents = computed(() => {
  let result = groupStudents.value;

  if (selectedCourse.value) {
    result = result.filter((s) => s.courseName === selectedCourse.value);
  }

  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((s) => s.fullName.toLowerCase().includes(query));
  }

  return result;
});

// Доступные курсы
const availableCourses = computed(() => {
  const courses = new Set();
  groupStudents.value.forEach((student) => {
    if (student.courseName) {
      courses.add(student.courseName);
    }
  });
  return Array.from(courses).sort();
});

// Группировка по группам
const groupedStudents = computed(() => {
  const grouped = {};

  filteredGroupStudents.value.forEach((student) => {
    const groupName = student.groupName || "Без группы";

    if (!grouped[groupName]) {
      grouped[groupName] = {
        courseName: student.courseName,
        startDate: student.startDate,
        endDate: student.endDate,
        students: [],
      };
    }

    grouped[groupName].students.push(student);
  });

  return grouped;
});

// Получить инициалы
function getInitials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return fullName[0];
}

// Переключение группы
function toggleGroup(groupName) {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName];
}

// Статус группы
function getGroupStatus(endDateStr) {
  if (!endDateStr) return { label: "Активна", class: "status-active" };

  const [day, month, year] = endDateStr.split(".").map(Number);
  const endDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (endDate < today) {
    return { label: "Завершена", class: "status-completed" };
  }
  return { label: "Активна", class: "status-active" };
}

// Открыть детали слушателя
function openStudentDetail(student) {
  selectedStudentId.value = student.id;
  selectedStudent.value = student;
  showStudentModal.value = true;
}

// Открыть детали по имени или ID (для режима групп)
function openStudentDetailByName(fullName, studentId = null) {
  // Сначала ищем по ID если есть
  if (studentId) {
    const studentFromAll = allStudents.value.find((s) => s.id === studentId);
    if (studentFromAll) {
      openStudentDetail(studentFromAll);
      return;
    }
    // Если не нашли в allStudents, используем ID напрямую
    selectedStudentId.value = studentId;
    selectedStudent.value = { id: studentId, fullName };
    showStudentModal.value = true;
    return;
  }

  // Ищем в полном списке по имени
  const student = allStudents.value.find(
    (s) => s.fullName.toLowerCase() === fullName.toLowerCase(),
  );

  if (student) {
    openStudentDetail(student);
  } else {
    // Если не нашли в allStudents, пытаемся найти в groupStudents
    const groupStudent = groupStudents.value.find(
      (s) => s.fullName.toLowerCase() === fullName.toLowerCase(),
    );

    if (groupStudent?.id) {
      selectedStudentId.value = groupStudent.id;
      selectedStudent.value = { id: groupStudent.id, fullName };
      showStudentModal.value = true;
    } else {
      // Показываем уведомление если не нашли слушателя
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert("Слушатель не найден в базе");
      }
    }
  }
}

// Закрыть модальное окно
function closeStudentModal() {
  showStudentModal.value = false;
  selectedStudentId.value = null;
  selectedStudent.value = null;
}
</script>

<style scoped>
.tg-students-tab {
  padding: 0;
  width: 100%;
  max-width: 100%;
}

/* Переключатель режимов */
.tg-view-switcher {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  padding: 0.25rem;
  background: #f1f5f9;
  border-radius: 12px;
}

.tg-view-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.625rem 0.75rem;
  background: transparent;
  border: none;
  border-radius: 10px;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-view-btn.active {
  background: white;
  color: #1e293b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.tg-view-btn:not(.active):active {
  background: #e2e8f0;
}

/* Нет доступа */
.tg-no-permission,
.tg-loading-block,
.tg-error-block,
.tg-empty-state {
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

.tg-error-icon-wrapper {
  background: #fee2e2;
  color: #dc2626;
}

.tg-no-permission h3,
.tg-empty-state h3 {
  font-size: 1.125rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #1e293b;
}

.tg-no-permission p,
.tg-empty-state p {
  color: #64748b;
  font-size: 0.9375rem;
}

/* Фильтры */
.tg-filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
  width: 100%;
}

.tg-search-wrapper {
  position: relative;
  width: 100%;
}

.tg-search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  color: #94a3b8;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-search-input {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 2.75rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.tg-search-input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.tg-search-input::placeholder {
  color: #94a3b8;
}

.tg-select {
  width: 100%;
  padding: 0.875rem 1rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  color: #1e293b;
  font-size: 0.9375rem;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 1.25rem;
  padding-right: 2.5rem;
}

.tg-select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

/* Загрузка */
.tg-loading-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
}

.tg-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #e2e8f0;
  border-top-color: #2563eb;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}

.tg-loading-block p {
  color: #64748b;
  font-size: 0.9375rem;
}

/* Ошибка */
.tg-error-block p {
  color: #dc2626;
  margin-bottom: 1rem;
}

.tg-btn-retry {
  background: #2563eb;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

/* Заголовок списка */
.tg-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}

.tg-list-header h3 {
  font-size: 1rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.tg-count {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* ===== РЕЖИМ: Все слушатели ===== */
.tg-students-grid {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.tg-student-card {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem;
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-student-card:active {
  background: #f8fafc;
  transform: scale(0.99);
}

.tg-student-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 0.9375rem;
  color: white;
  flex-shrink: 0;
}

.tg-student-main {
  flex: 1;
  min-width: 0;
}

.tg-student-main h4 {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0 0 0.125rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-position {
  font-size: 0.8125rem;
  color: #64748b;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-student-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.tg-meta-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.375rem;
  border-radius: 6px;
  font-weight: 500;
}

.tg-certs-badge {
  background: #eff6ff;
  color: #2563eb;
}

.tg-meta-date {
  font-size: 0.6875rem;
  color: #94a3b8;
}

.tg-student-arrow {
  color: #cbd5e1;
  flex-shrink: 0;
}

/* ===== РЕЖИМ: По группам ===== */
.tg-students-list {
  margin-top: 0.5rem;
  width: 100%;
}

/* Группа */
.tg-group-section {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  transition: all 0.2s;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  width: 100%;
}

.tg-group-header {
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  user-select: none;
  gap: 0.5rem;
}

.tg-group-header:active {
  background: #f8fafc;
}

.tg-group-info {
  flex: 1;
  min-width: 0;
}

.tg-group-title-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.tg-group-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.tg-group-status {
  font-size: 0.7rem;
  padding: 0.15rem 0.5rem;
  border-radius: 6px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.status-active {
  background: #dbeafe;
  color: #2563eb;
}

.status-completed {
  background: #f1f5f9;
  color: #64748b;
}

.tg-group-info p {
  font-size: 0.875rem;
  color: #64748b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-group-dates {
  font-size: 0.75rem;
  color: #94a3b8;
  margin-top: 0.25rem;
}

.tg-group-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
  margin-top: 2px;
}

.tg-student-count {
  background: #f1f5f9;
  color: #64748b;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.tg-toggle-icon {
  color: #94a3b8;
  transition: transform 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tg-toggle-icon.expanded {
  transform: rotate(180deg);
}

/* Студенты в группе */
.tg-students-in-group {
  border-top: 1px solid #e2e8f0;
  background: #f8fafc;
  padding: 0;
}

.tg-student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0;
  transition: background 0.2s;
  background: transparent;
  width: 100%;
  cursor: pointer;
}

.tg-student-item:active {
  background: #f1f5f9;
}

.tg-student-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.tg-student-info {
  flex: 1;
  min-width: 0;
}

.tg-student-info h5 {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1e293b;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tg-student-arrow-small {
  color: #cbd5e1;
  flex-shrink: 0;
}

/* Анимации */
.tg-collapse-enter-active,
.tg-collapse-leave-active {
  transition: all 0.3s ease;
  max-height: 500px;
  overflow: hidden;
}

.tg-collapse-enter-from,
.tg-collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
</style>
