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
            <option v-for="course in availableCourses" :key="course" :value="course">
              {{ course }}
            </option>
          </select>
        </div>

        <div class="tg-search-group">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Поиск по имени..."
            class="tg-search-input"
          />
          <span class="tg-search-icon">🔍</span>
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
        <div v-for="(groupData, groupName) in groupedStudents" :key="groupName" class="tg-group-section">
          <div class="tg-group-header" @click="toggleGroup(groupName)">
            <div class="tg-group-info">
              <h4>{{ groupName }}</h4>
              <p v-if="groupData.courseName">{{ groupData.courseName }}</p>
              <div v-if="groupData.startDate && groupData.endDate" class="tg-group-dates">
                📅 {{ groupData.startDate }} - {{ groupData.endDate }}
              </div>
            </div>
            <div class="tg-group-toggle">
              <span class="tg-student-count">{{ groupData.students.length }}</span>
              <span class="tg-toggle-icon" :class="{ expanded: expandedGroups[groupName] }">
                ▼
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
        <p v-else>В данный момент нет активных слушателей от вашей организации</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

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
const selectedCourse = ref('');
const searchQuery = ref('');
const expandedGroups = ref({});

// Доступные курсы
const availableCourses = computed(() => {
  const courses = new Set();
  students.value.forEach(student => {
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
    result = result.filter(s => s.courseName === selectedCourse.value);
  }

  // Поиск по имени
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(s => 
      s.fullName.toLowerCase().includes(query)
    );
  }

  return result;
});

// Группировка по группам
const groupedStudents = computed(() => {
  const grouped = {};

  filteredStudents.value.forEach(student => {
    const groupName = student.groupName || 'Без группы';
    
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
  if (!fullName) return '?';
  const parts = fullName.trim().split(' ');
  if (parts.length >= 2) {
    return parts[0][0] + parts[1][0];
  }
  return fullName[0];
}

// Переключение группы
function toggleGroup(groupName) {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName];
}

// Загрузка слушателей
async function loadStudents() {
  loading.value = true;
  error.value = null;

  try {
    const data = await $fetch('/api/tg-app/students', {
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
    console.error('Ошибка загрузки слушателей:', err);
    error.value = err.data?.message || 'Не удалось загрузить список слушателей';
  } finally {
    loading.value = false;
  }
}

// Загрузка при монтировании
watch(() => props.organizationId, (newId) => {
  if (newId) {
    loadStudents();
  }
}, { immediate: true });
</script>

<style scoped>
.tg-students-tab {
  padding: 1rem 0;
}

/* Нет доступа */
.tg-no-permission {
  text-align: center;
  padding: 3rem 1rem;
  color: #94a3b8;
}

.tg-no-permission .tg-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.tg-no-permission h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #f1f5f9;
}

/* Фильтры */
.tg-filters {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.tg-filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.tg-filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #94a3b8;
}

.tg-select {
  padding: 0.75rem 1rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 0.9375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-select:focus {
  outline: none;
  border-color: #3b82f6;
}

.tg-search-group {
  position: relative;
}

.tg-search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.75rem;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  color: #f1f5f9;
  font-size: 0.9375rem;
  transition: all 0.2s;
}

.tg-search-input:focus {
  outline: none;
  border-color: #3b82f6;
}

.tg-search-input::placeholder {
  color: #64748b;
}

.tg-search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.125rem;
}

/* Загрузка */
.tg-loading-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  gap: 1rem;
}

.tg-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: tg-spin 0.8s linear infinite;
}

.tg-loading-block p {
  color: #94a3b8;
  font-size: 0.9375rem;
}

/* Ошибка */
.tg-error-block {
  text-align: center;
  padding: 2rem 1rem;
}

.tg-error-block .tg-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
}

.tg-error-block p {
  color: #f87171;
  margin-bottom: 1rem;
}

.tg-btn-retry {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
  padding: 0.625rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tg-btn-retry:active {
  transform: scale(0.98);
}

/* Список */
.tg-students-list {
  margin-top: 1rem;
}

.tg-list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding: 0 0.5rem;
}

.tg-list-header h3 {
  font-size: 1.125rem;
  font-weight: 700;
  color: #f1f5f9;
}

.tg-count {
  background: rgba(59, 130, 246, 0.2);
  color: #3b82f6;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

/* Группа */
.tg-group-section {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  transition: all 0.2s;
}

.tg-group-header {
  padding: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  user-select: none;
}

.tg-group-header:active {
  background: rgba(255, 255, 255, 0.05);
}

.tg-group-info {
  flex: 1;
}

.tg-group-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #f1f5f9;
  margin-bottom: 0.25rem;
}

.tg-group-info p {
  font-size: 0.875rem;
  color: #94a3b8;
  margin: 0;
}

.tg-group-dates {
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 0.25rem;
}

.tg-group-toggle {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.tg-student-count {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
  padding: 0.25rem 0.625rem;
  border-radius: 8px;
  font-size: 0.8125rem;
  font-weight: 600;
}

.tg-toggle-icon {
  color: #64748b;
  transition: transform 0.2s;
  font-size: 0.75rem;
}

.tg-toggle-icon.expanded {
  transform: rotate(180deg);
}

/* Студенты в группе */
.tg-students-in-group {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 0.5rem;
}

.tg-student-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  transition: background 0.2s;
}

.tg-student-item:active {
  background: rgba(255, 255, 255, 0.05);
}

.tg-student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  color: white;
  flex-shrink: 0;
}

.tg-student-info h5 {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #f1f5f9;
  margin: 0;
}

/* Пусто */
.tg-empty-state {
  text-align: center;
  padding: 3rem 1rem;
}

.tg-empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.tg-empty-state h3 {
  font-size: 1.25rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: #f1f5f9;
}

.tg-empty-state p {
  color: #94a3b8;
  font-size: 0.9375rem;
}

/* Анимация коллапса */
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
  to { transform: rotate(360deg); }
}
</style>
