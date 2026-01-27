<template>
  <div class="tg-students-tab">
    <!-- Проверка доступа -->
    <div v-if="!permissions?.can_view_students" class="tg-no-permission">
      <span class="tg-icon">🚫</span>
      <h3>Нет доступа</h3>
      <p>У вас нет прав на просмотр списка слушателей</p>
    </div>

    <div v-else>
      <!-- Фильтры -->
      <div class="tg-filters">
        <div class="tg-filter-group">
          <label class="tg-filter-label">Курс</label>
          <select v-model="selectedCourse" class="tg-select">
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

        <div class="tg-search-group">
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
        </div>
      </div>

      <!-- Загрузка -->
      <div v-if="loading" class="tg-loading-block">
        <div class="tg-spinner"></div>
        <p>Загрузка слушателей...</p>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="tg-error-block">
        <span class="tg-icon">⚠️</span>
        <p>{{ error }}</p>
        <button @click="loadStudents" class="tg-btn-retry">Повторить</button>
      </div>

      <!-- Список слушателей -->
      <div v-else-if="filteredStudents.length > 0" class="tg-students-list">
        <div class="tg-list-header">
          <h3>Слушатели</h3>
          <span class="tg-count">{{ filteredStudents.length }}</span>
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
            <div v-if="expandedGroups[groupName]" class="tg-students-in-group">
              <div
                v-for="(student, index) in groupData.students"
                :key="index"
                class="tg-student-item"
              >
                <div class="tg-student-avatar">
                  {{ getInitials(student.fullName) }}
                </div>
                <div class="tg-student-info">
                  <h5>{{ student.fullName }}</h5>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </div>

      <!-- Пусто -->
      <div v-else class="tg-empty-state">
        <span class="tg-empty-icon">📭</span>
        <h3>Нет слушателей</h3>
        <p v-if="searchQuery || selectedCourse">Попробуйте изменить фильтры</p>
        <p v-else>
          В данный момент нет активных слушателей от вашей организации
        </p>
      </div>
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
});

// Состояние
const loading = ref(false);
const error = ref(null);
const students = ref([]);
const selectedCourse = ref("");
const searchQuery = ref("");
const expandedGroups = ref({});

// Доступные курсы
const availableCourses = computed(() => {
  const courses = new Set();
  students.value.forEach((student) => {
    if (student.courseName) {
      courses.add(student.courseName);
    }
  });
  return Array.from(courses).sort();
});

// Фильтрованные студенты
const filteredStudents = computed(() => {
  let result = students.value;

  // Фильтр по курсу
  if (selectedCourse.value) {
    result = result.filter((s) => s.courseName === selectedCourse.value);
  }

  // Поиск по имени
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter((s) => s.fullName.toLowerCase().includes(query));
  }

  return result;
});

// Группировка по группам
const groupedStudents = computed(() => {
  const grouped = {};

  filteredStudents.value.forEach((student) => {
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

  // Парсим дату dd.mm.yyyy
  const [day, month, year] = endDateStr.split(".").map(Number);
  const endDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Обнуляем время для корректного сравнения

  if (endDate < today) {
    return { label: "Завершена", class: "status-completed" };
  }
  return { label: "Активна", class: "status-active" };
}

// Загрузка слушателей
async function loadStudents() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch("/api/tg-app/students", {
      params: {
        organizationId: props.organizationId,
      },
    });

    students.value = data.students || [];

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

// Загрузка при монтировании
watch(
  () => props.organizationId,
  (newId) => {
    if (newId) {
      loadStudents();
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.tg-students-tab {
  padding: 0;
  width: 100%;
  max-width: 100%;
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

.tg-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.tg-filter-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  margin-left: 0.25rem;
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
  transition: all 0.2s;
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

.tg-loading-block p {
  color: #64748b;
  font-size: 0.9375rem;
}

/* Ошибка */
.tg-error-block .tg-icon-wrapper {
  background: #fee2e2;
  color: #dc2626;
}

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

/* Список */
.tg-students-list {
  margin-top: 0.5rem;
  width: 100%;
}

.tg-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
}

.tg-list-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.tg-count {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
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
  align-items: flex-start; /* Align top for multi-line support */
  justify-content: space-between;
  user-select: none;
  gap: 0.5rem;
}

.tg-group-header:active {
  background: #f8fafc;
}

.tg-group-info {
  flex: 1;
  min-width: 0; /* Important for flex child truncation */
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

/* Статусы */
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
  display: flex;
  align-items: center;
  gap: 0.25rem;
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
  padding: 0; /* Remove padding for edge-to-edge feel */
}

.tg-student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem; /* Increase side padding */
  border-radius: 0;
  transition: background 0.2s;
  background: transparent;
  width: 100%;
}

.tg-student-item:not(:last-child) {
  border-bottom: 1px solid #f1f5f9;
}

.tg-student-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #3b82f6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  flex-shrink: 0;
}

.tg-student-info {
  flex: 1;
  min-width: 0; /* Important for flex child truncation */
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

/* Анимация */
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

@keyframes tg-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
